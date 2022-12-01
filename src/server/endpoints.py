from __future__ import annotations

import abc
import contextlib
import dataclasses
import json
import os.path
import time
from typing import TypeVar, Generic, Type, Any, Callable, Optional, Tuple, List, Mapping

import requests
import vcr
from dropbox import Dropbox
from dropbox.exceptions import HttpError
from dropbox.files import (
    ListFolderResult,
    FileMetadata as DbFileMetadata,
    DeletedMetadata,
    WriteMode,
)
from dropbox.users import FullAccount
from flask import Response, request, make_response, redirect, session, send_file
from flask.testing import FlaskClient
from pydantic import ValidationError, BaseModel
from werkzeug.exceptions import Unauthorized, TooManyRequests

from .app import app
from .conftest import (
    write_to_cache,
    get_value_from_cache_or_browser,
    exampe_raw_note,
    encode_note,
    note_from_terms,
)
from .datasource import User, SyncCursor, Term

T = TypeVar("T")


class JsonEndpoint(BaseModel, Generic[T], abc.ABC):
    @abc.abstractmethod
    def handle(self, res: T) -> Response | None:
        pass


def user_dropbox() -> Tuple[User, Dropbox]:
    if user_id := session.get("user_id"):
        if user := app.store.get(User, user_id):
            return user, Dropbox(
                app_secret=app.app_secret,
                app_key=app.app_key,
                oauth2_refresh_token=user.refresh_token,
            )
        session.pop("user_id")

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
                    session.pop("user_id")
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


@vcr.use_cassette(
    os.path.join(app.root_path, "src/server/.test_cache/login.yaml"), record_mode="once"
)
def test_login_endpoint(client: FlaskClient, authorization_code) -> None:
    response = client.post("/login", json=Login())
    assert response.status_code == 401

    assert authorization_code
    response = client.post("/login", json=Login(authorization_code=authorization_code))

    json_response = response.get_json(force=True)
    assert json_response["success"]
    assert json_response["email"]
    with client.session_transaction() as session:
        assert session["user_id"] == 1
    assert (user := app.store.get(User, 1))
    assert json_response["access_token"]
    assert json_response["app_key"] == app.app_key

    response = client.post("/login", json=Login())
    json_response = response.get_json(force=True)
    assert json_response["success"]
    assert json_response["email"]
    assert json_response["access_token"]


class LoginResponse(BaseModel):
    success: bool = True
    email: str = ""
    access_token: str = ""
    app_key: str = ""


@as_json_handler("/login", lambda: LoginResponse(), methods=["POST"])
class Login(JsonEndpoint[LoginResponse]):
    authorization_code: Optional[str] = None

    def handle(self, resp: LoginResponse) -> Response | None:
        user: User | None = None
        try:
            user, _ = user_dropbox()
        except Unauthorized:
            pass

        db: Dropbox
        if user is None or self.authorization_code:
            if not self.authorization_code:
                raise Unauthorized()
            refresh_token = self.get_refresh_token()
            account, db = self.login(refresh_token)
        else:
            account, db = self.login(user.refresh_token)

        resp.email = account.email
        resp.access_token = db._oauth2_access_token
        resp.app_key = app.app_key
        return None

    def get_refresh_token(self) -> str:
        response = requests.post(
            "https://api.dropboxapi.com/oauth2/token",
            data=dict(
                code=self.authorization_code,
                grant_type="authorization_code",
            ),
            auth=(app.app_key, app.app_secret),
        )

        try:
            refresh_token = OauthTokenResponse.parse_obj(response.json()).refresh_token
        except ValidationError:
            print(response.json())
            raise Unauthorized()
        write_to_cache("refresh_token", refresh_token)
        return refresh_token

    def login(self, refresh_token: str) -> Tuple[FullAccount, Dropbox]:
        db = Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=app.app_key,
            app_secret=app.app_secret,
        )

        account: FullAccount = db.users_get_current_account()

        with app.store.connection:
            user_id = app.store.upsert(
                User(
                    account_id=account.account_id,
                    email=account.email,
                    refresh_token=refresh_token,
                )
            )

        session["user_id"] = user_id
        return account, db


@vcr.use_cassette(
    os.path.join(app.root_path, "src/server/.test_cache/sync.yaml"), record_mode="once"
)
def test_sync_endpoint(
    client: FlaskClient, logged_in_user: User, cleaned_dropbox: Dropbox
) -> None:
    for i in range(1000):
        response = client.post("/sync", json=Sync())
        assert response.json["success"]
        if not response.json["has_more"]:
            break
    else:
        raise ValueError("Never finished syncing test deletes")

    start = int(time.time())
    uploaded: DbFileMetadata = cleaned_dropbox.files_upload(
        exampe_raw_note, "/test1.txt"
    )
    response = client.post("/sync", json=Sync())
    assert response.json["success"]
    assert not response.json["has_more"]

    terms = list(app.store.fetch(Term))

    assert len(terms) > 0
    assert all(t.updated_at >= start for t in terms)
    assert terms == [
        Term(
            id=terms[0].id,
            deleted=0,
            updated_at=terms[0].updated_at,
            due_next_minutes=29297068,
            user_id=terms[0].user_id,
            note_path=uploaded.path_lower,
            note_rev=uploaded.rev,
            note_id=uploaded.id,
            language="Japanese",
            reference="看病",
            marker="1",
            definition="かんびょう 1 ［看病］\n\n\n〈スル〉 病人の世話をすること．\n",
            url="",
            related="",
        )
    ]

    user_2_id = app.store.upsert(
        User(account_id="blahblah", email="thing", refresh_token="moo")
    )
    copied_term = terms[0].copy()
    copied_term.user_id = user_2_id
    del copied_term.id
    app.store.upsert(copied_term)

    terms = list(app.store.fetch(Term))
    assert len(terms) == 2

    cleaned_dropbox.files_delete_v2(terms[0].note_path)
    response = client.post("/sync", json=Sync())
    assert not response.json["has_more"]

    assert [1, 0] == [t.deleted for t in app.store.fetch(Term)]

    note_1_term_1 = Term(
        updated_at=0,
        due_next_minutes=1000,
        user_id=1,
        note_path="",
        note_rev="",
        note_id="",
        language="",
        reference="reference1",
        marker="marker1",
        definition="definition1",
        url="url1",
        related="related1,related2",
    )

    note_1_term_2 = Term(
        updated_at=0,
        due_next_minutes=1000,
        user_id=1,
        note_path="",
        note_rev="",
        note_id="",
        language="",
        reference="reference2",
        marker="marker2",
        definition="definition2",
        url="url2",
        related="related3",
    )

    note_2_term_1 = Term(
        updated_at=0,
        due_next_minutes=1000,
        user_id=1,
        note_path="",
        note_rev="",
        note_id="",
        language="",
        reference="reference3",
        marker="marker3",
        definition="definition3",
        url="url3",
        related="related4",
    )

    cleaned_dropbox.files_upload(
        encode_note(
            attributes=note_from_terms(
                terms=[
                    note_1_term_1,
                    note_1_term_2,
                ]
            )
        ),
        "/note1.txt",
    )

    cleaned_dropbox.files_upload(
        encode_note(
            attributes=note_from_terms(
                terms=[
                    note_2_term_1,
                ]
            )
        ),
        "/note2.txt",
    )

    cleaned_dropbox.files_upload(
        encode_note(
            attributes=note_from_terms(
                terms=[
                    note_2_term_1,
                ]
            )
        ),
        "/text3.mp3",
    )

    cleaned_dropbox.files_upload(b"note a note!", "/blah.txt")
    cleaned_dropbox.files_upload(b"note a note!\n===\n%%%%", "/blah2.txt")

    while True:
        response = client.post("/sync", json=Sync())
        if not response.json["has_more"]:
            break

    terms = list(app.store.fetch(Term, "user_id = 1", "deleted = 0"))
    skip_attrs = {"id", "note_path", "note_rev", "note_id", "updated_at", "language"}
    assert [t.dict(exclude=skip_attrs) for t in terms] == [
        t.dict(exclude=skip_attrs)
        for t in [note_1_term_1, note_1_term_2, note_2_term_1]
    ]

    note_2_term_1.reference = "new_reference"
    cleaned_dropbox.files_upload(
        encode_note(
            attributes=note_from_terms(
                terms=[
                    note_2_term_1,
                ]
            )
        ),
        "/note2.txt",
        mode=WriteMode.overwrite,
    )

    while True:
        response = client.post("/sync", json=Sync())
        if not response.json["has_more"]:
            break

    terms = list(app.store.fetch(Term, "user_id = 1", "deleted = 0"))
    skip_attrs = {"id", "note_path", "note_rev", "note_id", "updated_at", "language"}
    assert [t.dict(exclude=skip_attrs) for t in terms] == [
        t.dict(exclude=skip_attrs)
        for t in [note_1_term_1, note_1_term_2, note_2_term_1]
    ]


@dataclasses.dataclass
class DeltaSet:
    deletes: List[str]
    updates: List[DbFileMetadata]


class SyncResponse(BaseModel):
    success = True
    has_more: bool = False


def find_term_attributes(
    note_path: str,
    note_rev: str,
    note_id: str,
    user_id: int,
    note_payload: Mapping[str, Any],
) -> List[Term]:
    result: List[Term] = []
    language = note_payload.get("language", "")
    for term in note_payload.get("terms", []):
        term = term.get("attributes", {})
        clozes = [
            c.get("attributes", {})
            for c in term.get("clozes", [])
            if c.get("attributes", {}).get("type")
            in ("produce", "recognize", "listen", "speak")
        ]
        if not clozes:
            continue

        result.append(
            Term(
                deleted=0,
                updated_at=int(time.time()),
                user_id=user_id,
                note_path=note_path,
                note_rev=note_rev,
                note_id=note_id,
                language=language,
                reference=term.get("reference", ""),
                marker=term.get("marker", ""),
                definition=term.get("definition", ""),
                url=term.get("url") or "",
                related=",".join(term.get("related", [])),
                due_next_minutes=min(
                    c.get("schedule", {}).get("nextDueMinutes", 0) for c in clozes
                ),
            )
        )
    return result


@as_json_handler("/sync", lambda: SyncResponse(), methods=["POST"])
class Sync(JsonEndpoint[SyncResponse]):
    def handle(self, res: SyncResponse) -> Response | None:
        user, dropbox = user_dropbox()
        cursor: SyncCursor = SyncCursor(user_id=user.id)
        for sync_cursor in app.store.fetch(
            SyncCursor, "user_id = :user_id", user_id=user.id
        ):
            cursor = sync_cursor

        batch = self.get_next_batch(cursor, dropbox)
        res.has_more = batch.has_more
        cursor.value = batch.cursor

        delta = self.unpack_delta(user, batch)
        self.apply_delta(user, delta, dropbox, cursor)
        return None

    def apply_delta(
        self, user: User, delta: DeltaSet, dropbox: Dropbox, cursor: SyncCursor
    ) -> None:
        with app.store.connection:
            for deleted_path in delta.deletes:
                if deleted_path.endswith("/"):
                    existing = app.store.fetch(
                        Term,
                        "note_path >= :left",
                        "note_path < :right",
                        "user_id = :user_id",
                        left=deleted_path,
                        right=deleted_path + "\uFFFE",
                        user_id=user.id,
                    )
                else:
                    existing = app.store.fetch(
                        Term,
                        "note_path = :path",
                        "user_id = :user_id",
                        user_id=user.id,
                        path=deleted_path,
                    )
                for row in existing:
                    row.updated_at = int(time.time())
                    row.deleted = 1
                    app.store.upsert(row)

            for updated_entry in delta.updates:
                _, ext = os.path.splitext(updated_entry.path_lower)
                if ext != ".txt":
                    continue

                app.store.delete(
                    Term,
                    "user_id = :user_id",
                    "note_path = :path",
                    user_id=user.id,
                    path=updated_entry.path_lower,
                )

                if updated_entry.size > 1024 * 1024 * 5:
                    continue

                _, response = dropbox.files_download(
                    updated_entry.path_lower, updated_entry.rev
                )
                with contextlib.closing(response):
                    content = response.text
                parts = content.split("\n===\n")
                if len(parts) != 2:
                    continue

                try:
                    note_attributes = json.loads(parts[1])
                except:
                    continue

                for term in find_term_attributes(
                    updated_entry.path_lower,
                    updated_entry.rev,
                    updated_entry.id,
                    user.id,
                    note_attributes,
                ):
                    app.store.upsert(term)

            app.store.upsert(cursor)

    def unpack_delta(self, user: User, batch: ListFolderResult) -> DeltaSet:
        delta = DeltaSet(deletes=[], updates=[])
        for entry in batch.entries:
            if isinstance(entry, DbFileMetadata):
                delta.updates.append(entry)
            elif isinstance(entry, DeletedMetadata):
                delta.deletes.append(entry.path_lower)
        return delta

    def get_next_batch(self, cursor: SyncCursor, dropbox: Dropbox) -> ListFolderResult:
        next: ListFolderResult
        if cursor.value:
            next = dropbox.files_list_folder_continue(cursor=cursor.value)
        else:
            next = dropbox.files_list_folder(
                recursive=True, include_deleted=True, limit=app.batch_size, path=""
            )
        return next


class TermsResponse(BaseModel):
    last_updated_at: int = -1
    last_id: int = -1
    terms: List[Term] = []
    success: bool = True


@as_json_handler("/terms", lambda: TermsResponse(), methods=["POST"])
class Terms(JsonEndpoint[TermsResponse]):
    last_updated_at: int = -1
    last_id: int = -1

    def handle(self, res: TermsResponse) -> Response | None:
        user, dropbox = user_dropbox()

        res.last_updated_at = self.last_updated_at
        res.last_id = self.last_id

        for row in app.store.fetch(
            Term,
            "updated_at > :last_updated OR (updated_at = :last_updated AND id > :last_id)",
            "user_id = :user_id",
            limit=app.batch_size,
            order_by="updated_at ASC",
            last_updated=self.last_updated_at,
            last_id=self.last_id,
            user_id=user.id,
        ):
            res.last_id = row.id
            res.last_updated_at = row.updated_at
            res.terms.append(row)

        return None


def test_terms(client: FlaskClient, logged_in_user: User):
    def add_term(t: int) -> Term:
        id = app.store.upsert(
            Term(
                updated_at=t,
                due_next_minutes=100,
                user_id=logged_in_user.id,
            )
        )
        return list(app.store.fetch(Term, "id = :id", id=id))[0]

    response = TermsResponse.parse_obj(client.post("/terms", json=Terms()).json)
    assert response.last_id == -1
    assert response.last_updated_at == -1
    assert response.terms == []

    terms: List[Term] = []
    terms.append(add_term(2))
    terms.append(add_term(1))
    terms.append(add_term(1))
    terms.append(add_term(3))

    response = TermsResponse.parse_obj(
        client.post(
            "/terms",
            json=Terms(
                last_updated_at=response.last_updated_at, last_id=response.last_id
            ),
        ).json
    )
    assert response.terms == [terms[1]]
    assert response.last_id == 2
    assert response.last_updated_at == 1

    response = TermsResponse.parse_obj(
        client.post(
            "/terms",
            json=Terms(
                last_updated_at=response.last_updated_at, last_id=response.last_id
            ),
        ).json
    )
    assert response.last_id == 3
    assert response.last_updated_at == 1
    assert response.terms == [terms[2]]

    response = TermsResponse.parse_obj(
        client.post(
            "/terms",
            json=Terms(
                last_updated_at=response.last_updated_at, last_id=response.last_id
            ),
        ).json
    )
    assert response.last_id == 1
    assert response.last_updated_at == 2
    assert response.terms == [terms[0]]

    response = TermsResponse.parse_obj(
        client.post(
            "/terms",
            json=Terms(
                last_updated_at=response.last_updated_at, last_id=response.last_id
            ),
        ).json
    )
    assert response.last_id == 4
    assert response.last_updated_at == 3
    assert response.terms == [terms[3]]

    response = TermsResponse.parse_obj(
        client.post(
            "/terms",
            json=Terms(
                last_updated_at=response.last_updated_at, last_id=response.last_id
            ),
        ).json
    )
    assert response.last_id == 4
    assert response.last_updated_at == 3
    assert response.terms == []

@app.route("/authorize")
def authorize():
    return make_response("""
    <html>
        <form method="GET" action="/">
            <input name="at" type="text"/>
        </form>
    </html>
    """)