from __future__ import annotations

import abc
import contextlib
import json
import mimetypes
import os.path
import time
from typing import TypeVar, Generic, Type, Any, Callable, Optional, Tuple, List, Mapping

import dropbox
import requests
import vcr
from dropbox import Dropbox
from dropbox.exceptions import HttpError
from dropbox.files import ListFolderResult, FileMetadata as DbFileMetadata, DeletedMetadata
from dropbox.users import FullAccount
from flask import Response, request, make_response, redirect, session, send_file
from flask.testing import FlaskClient
from pydantic import ValidationError, BaseModel
from werkzeug.exceptions import Unauthorized, TooManyRequests, NotFound

from .app import app
from .conftest import write_to_cache, get_value_from_cache_or_browser, get_from_cache
from .datasource import User, SyncCursor, FileMetadata, Tombstone

T = TypeVar("T")
class JsonEndpoint(BaseModel, Generic[T], abc.ABC):
    @abc.abstractmethod
    def handle(self, res: T) -> Response | None:
        pass

def user_dropbox() -> Tuple[User, Dropbox]:
    if user_id := session.get('user_id'):
        if user := app.store.get(User, user_id):
            return user, Dropbox(app_secret=app.app_secret, app_key=app.app_key, oauth2_refresh_token=user.refresh_token)
        session.pop('user_id')

    raise Unauthorized()


JET = TypeVar("JET", bound=JsonEndpoint[Any])


_bad_json_response = json.dumps(dict(error="Json body needs to be a dictionary!"))


def as_json_handler(
    route: str,
    resp_factory: Callable[[], T],
    **options: Any,
) -> Callable[[Type[JET]], Type[JET]]:
    def wrapper(endpoint_cls: Type[JET]) -> Type[JET]:
        def handler():
            raw: Any = request.get_json(force=True)
            if not isinstance(raw, dict):
                return make_response((_bad_json_response, 400))

            try:
                json_endpoint = endpoint_cls.parse_obj(raw)
            except ValidationError as e:
                return make_response((e.json(), 400))

            json_resp = resp_factory()
            try:
                flask_resp = json_endpoint.handle(json_resp)
            except HttpError as e:
                if e.status_code == 429:
                    raise TooManyRequests()
                if e.status_code == 401:
                    session.pop('user_id')
                    raise Unauthorized()
                raise e
            if flask_resp is not None:
                return flask_resp
            if isinstance(json_resp, BaseModel):
                json_resp = json_resp.dict()
            return make_response(json_resp)

        handler.__name__ = endpoint_cls.__name__

        app.route(route, **options)(handler)
        return endpoint_cls

    return wrapper


def test_start():
    get_value_from_cache_or_browser("authorization-code", app.start_url, 0)

@app.route("/")
@app.route("")
def index_endpoint():
    return send_file(os.path.join(app.root_path, app.static_folder, "index.html"))

@app.route("/start")
def start_endpoint():
    return redirect(app.start_url)


class OauthTokenResponse(BaseModel):
    access_token: str
    account_id: str
    expires_in: int
    refresh_token: str
    token_type: str
    uid: str

@vcr.use_cassette('.test_cache/login.yaml', record_mode='once')
def test_login_endpoint(client: FlaskClient) -> None:
    authorization_code = get_from_cache("authorization-code")
    assert authorization_code
    response = client.post(
        "/login", json=Login(authorization_code=authorization_code)
    )

    json_response = response.get_json(force=True)
    assert json_response["success"]
    assert json_response["email"]
    with client.session_transaction() as session:
        assert session['user_id'] == 1
    assert (user := app.store.get(User, 1))
    write_to_cache("refresh-token", user.refresh_token)

@as_json_handler("/login", lambda: dict(success=True), methods=["POST"])
class Login(JsonEndpoint[dict[str, Any]]):
    authorization_code: Optional[str] = None
    refresh_token: Optional[str] = None

    def handle(self, resp: dict[str, Any]) -> Response | None:
        if not self.refresh_token:
            self.refresh_token = self.get_refresh_token()
        write_to_cache("refresh_token", self.refresh_token)
        account = self.login()
        resp['email'] = account.email

    def get_refresh_token(self) -> str:
        response = requests.post(
            "https://api.dropboxapi.com/oauth2/token",
            data=dict(
                code=self.authorization_code,
                grant_type="authorization_code",
            ),
            auth=(app.app_key, app.app_secret),
        )

        return OauthTokenResponse.parse_obj(response.json()).refresh_token

    def login(self) -> FullAccount:
        assert self.refresh_token
        db = dropbox.Dropbox(oauth2_refresh_token=self.refresh_token, app_key=app.app_key, app_secret=app.app_secret)
        account: FullAccount = db.users_get_current_account()
        with app.store.connection:
            user_id = app.store.upsert(User(
                account_id=account.account_id,
                email=account.email,
                refresh_token=self.refresh_token,
            ))
        session['user_id'] = user_id
        return account


@vcr.use_cassette('.test_cache/sync.yaml', record_mode='once')
def test_sync_endpoint(client: FlaskClient, logged_in_user: User) -> None:
    for i in range(1000):
        response = client.post("/sync", json=Sync(include_deletes=True))
        assert response.json["success"]

        if list(app.store.fetch(FileMetadata)):
            break
    else:
        raise ValueError("Never found a persisted file metadata object")

class DeltaSet(BaseModel):
    deletes: List[str] = []
    updates: List[FileMetadata] = []

class SyncResponse(BaseModel):
    success = True
    has_more: bool = False


@as_json_handler("/sync", lambda: SyncResponse(), methods=["POST"])
class Sync(JsonEndpoint[SyncResponse]):
    include_deletes: bool = False

    def handle(self, res: SyncResponse) -> Response | None:
        user, dropbox = user_dropbox()
        cursor: SyncCursor = SyncCursor(user_id=user.id)
        for sync_cursor in app.store.fetch(SyncCursor, "user_id = :user_id", user_id=user.id):
            cursor = sync_cursor

        batch = self.get_next_batch(cursor, dropbox)
        res.has_more = batch.has_more
        cursor.value = batch.cursor

        delta = self.unpack_delta(user, batch)
        self.apply_delta(user, delta, dropbox, cursor)

    def apply_delta(self, user: User, delta: DeltaSet, dropbox: Dropbox, cursor: SyncCursor) -> None:
        with app.store.connection:
            for deleted_path in delta.deletes:
                for row in app.store.fetch(FileMetadata, "path >= :left", "path < :right", "user_id = :user_id", left=deleted_path,
                                 right=deleted_path + "\uFFFE", user_id=user.id):
                    app.store.upsert(Tombstone(
                        user_id=user.id,
                        remote_id=row.remote_id,
                        updated_at=int(time.time()),
                    ))
                app.store.delete(FileMetadata, "path >= :left", "path < :right", "user_id = :user_id", left=deleted_path,
                                 right=deleted_path + "\uFFFE", user_id=user.id)
            for updated_entry in delta.updates:
                app.store.upsert(updated_entry)
                response: requests.Response
                _, ext = os.path.splitext(updated_entry.path)
                if ext == 'txt' and updated_entry.size < 1024 * 1024 * 5:
                    _, response = dropbox.files_download(updated_entry.path, updated_entry.rev)
                    with contextlib.closing(response):
                        with app.write_cache_entry(updated_entry.remote_id) as file:
                            for chunk in response.iter_content():
                                file.write(chunk)

            app.store.upsert(cursor)

    def unpack_delta(self, user: User, batch: ListFolderResult) -> DeltaSet:
        delta = DeltaSet()
        for entry in batch.entries:
            if isinstance(entry, DbFileMetadata):
                delta.updates.append(FileMetadata(
                    path=entry.path_lower,
                    rev=entry.rev,
                    size=entry.size,
                    remote_id=entry.id,
                    user_id=user.id,
                    updated_at=int(time.time()),
                ))
            elif isinstance(entry, DeletedMetadata):
                delta.deletes.append(entry.path_lower)
        return delta

    def get_next_batch(self, cursor: SyncCursor, dropbox: Dropbox) -> ListFolderResult:
        next: ListFolderResult
        if cursor.value:
            next = dropbox.files_list_folder_continue(cursor=cursor.value)
        else:
            next = dropbox.files_list_folder(recursive=True, include_deleted=self.include_deletes, limit=50, path="")
        return next

@app.route('/download/<blob_id>')
def download(blob_id: str) -> Response | None:
    user, dropbox = user_dropbox()
    metadata: FileMetadata | None = None

    for row in app.store.fetch(FileMetadata, "remote_id = :blob_id", "user_id = :user_id", blob_id=blob_id, user_id=user.id):
        metadata = row

    if not metadata:
        raise NotFound()

    mimetype, _ = mimetypes.guess_type(metadata.path)

    with app.read_blob(metadata, dropbox) as file:
        return send_file(
            file,
            mimetype=mimetype,
            download_name=os.path.basename(metadata.path),
            etag=metadata.rev,
        )

class Note(BaseModel):
    normalized_data: Mapping[str, Any]
    path: str
    id: str
    version: str


class NotesResponse(BaseModel):
    last_updated_at: int = -1
    notes: List[Note] = []
    deleted_ids: List[str] = []
    success: bool = True


@as_json_handler('/notes', lambda: NotesResponse(), methods=["POST"])
class Notes(JsonEndpoint[NotesResponse]):
    last_updated_at: int = -1
    include_deletes: bool = False

    def handle(self, res: NotesResponse) -> Response | None:
        user, dropbox = user_dropbox()

        res.last_updated_at = self.last_updated_at

        for row in app.store.fetch(
                FileMetadata,
                "updated_at >= :last_updated",
                "user_id = :user_id",
                limit=100,
                last_updated=self.last_updated_at,
                user_id=user.id
        ):
            with app.read_blob(row, dropbox) as file:
                data: bytes = file.read()
                body = data.decode("utf-8")
                try:
                    idx = body.index("\n===\n")
                    attributes = json.loads(body[idx+5:])
                    attributes["content"] = body[:idx]

                    res.notes.append(
                        Note(normalized_data=dict(attributes=attributes), path=row.path, id=row.remote_id, version=row.rev)
                    )
                except:
                    pass
                res.last_updated_at = max(res.last_updated_at, row.updated_at)

        if self.include_deletes:
            for row in app.store.fetch(
                    Tombstone,
                    "updated_at >= :last_updated",
                    "user_id = :user_id",
                    last_updated=self.last_updated_at,
                    user_id=user.id
            ):
                res.deleted_ids.append(row.remote_id)

def test_notes_and_download(client: FlaskClient, logged_in_user: User):
    test_sync_endpoint(client, logged_in_user)

    with vcr.use_cassette('.test_cache/notes_and_download.yaml', record_mode='once'):
        response = client.post("/notes", json=Notes())
        assert response.json["success"]
        assert response.json["deleted_ids"] == []

        note = response.json["notes"][0]
        last_updated_at = response.json["last_updated_at"]

        response = client.get(f"/download/{note['id']}")
        del note["normalized_data"]["attributes"]["content"]
        assert json.loads(response.get_data(as_text=True).split("\n===\n")[1]) == note["normalized_data"]["attributes"]
        assert response.mimetype == "text/plain"

        response = client.post("/notes", json=Notes(last_updated_at=last_updated_at + 1, include_deletes=True))
        assert response.json["success"]
        assert response.json["deleted_ids"] == []
        assert response.json["notes"] == []
        #
        # response = client.post("/notes", json=Notes(last_updated_at=last_updated_at - 100, include_deletes=True))
        # assert response.json["success"]
        # assert response.json["deleted_ids"] != []
        # assert response.json["notes"] != []
