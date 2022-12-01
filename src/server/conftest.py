from __future__ import annotations

import json
import os
import time
import webbrowser
from threading import Thread
from typing import Any, Mapping, List

import pytest
import vcr
from dropbox import Dropbox
from dropbox.files import FileMetadata, FolderMetadata
from flask import Flask, request, make_response
from flask.testing import FlaskClient
from pydantic.json import pydantic_encoder
from werkzeug.serving import make_server

from .app import app, override

import pickle

from .datasource import Term


class PickleSerializer:
    def deserialize(self, data: bytes):
        return pickle.loads(data)

    def serialize(self, data: dict):
        return pickle.dumps(data)


vcr.default_vcr.register_serializer("pickle", PickleSerializer())


@pytest.fixture(autouse=True)
def cleanup_app():
    app.testing = True
    try:
        yield
    finally:
        app.reset()


@pytest.fixture()
def client() -> FlaskClient:
    client = app.test_client()

    def json_dumps(v: Any) -> str:
        return json.dumps(v, default=pydantic_encoder)

    client.json_dumps = json_dumps  # type: ignore
    return client


@pytest.fixture(autouse=True)
def enable_small_batch_size():
    with override(batch_size=1):
        yield


@pytest.fixture(autouse=True)
def enable_test_app_key():
    with override(app_key="maqaopdydxaw7hk"):
        yield


@pytest.fixture(autouse=True)
def enable_test_doc_store():
    with override(blob_path="src/server/.test_cache/blobs"):
        yield


@pytest.fixture(autouse=True)
def enable_app_secret(secret_key: str):
    with override(app_secret=secret_key):
        yield


@pytest.fixture(autouse=True)
def enable_test_store():
    with override(store_path=":memory:"), app.open_store():
        app.store.migrate()
        yield


@pytest.fixture
def cleaned_dropbox(refresh_token, secret_key, enable_test_app_key):
    db = Dropbox(
        oauth2_refresh_token=refresh_token, app_key=app.app_key, app_secret=secret_key
    )
    resp = db.files_list_folder("", recursive=False, limit=100)
    while True:
        for entry in resp.entries:
            if isinstance(entry, FileMetadata):
                db.files_delete_v2(entry.path_lower)
            if isinstance(entry, FolderMetadata):
                db.files_delete_v2(entry.path_lower)

        if resp.has_more:
            resp = db.files_list_folder_continue(cursor=resp.cursor)
        else:
            break
    return db


def note_from_terms(
    *, language: str = "language", terms: List[Term]
) -> Mapping[str, Any]:
    return dict(
        language=language,
        terms=[
            dict(
                attributes=dict(
                    reference=term.reference,
                    marker=term.marker,
                    definition=term.definition,
                    url=term.url,
                    related=term.related.split(","),
                    clozes=[
                        dict(
                            attributes=dict(
                                type="recognize",
                                clozed="",
                                schedule=dict(
                                    nextDueMinutes=term.due_next_minutes,
                                ),
                            )
                        )
                    ],
                )
            )
            for term in terms
        ],
    )


def encode_note(*, content="", attributes: Mapping[str, Any]) -> bytes:
    return f"{content}\n===\n{json.dumps(attributes)}".encode("utf8")


def get_value_from_cache_or_browser(
    label: str, url: str, exp: float = 1000000000
) -> str:
    fake_app = Flask(__name__)
    code: str = ""

    if result := get_from_cache(label, exp):
        return result

    @fake_app.route("/", methods=["GET", "POST"])
    def get_it():
        nonlocal code
        if request.method == "GET":
            return make_response(
                f"<html><form action='/' method='POST'>{label}<input type='text' name='code'><input type='submit'></form></html>"
            )

        if request.content_length < 10000:
            code = request.form["code"]

        Thread(target=server.shutdown).start()
        return ""

    webbrowser.open_new(url)
    webbrowser.open_new("http://localhost:5001/")

    server = make_server("127.0.0.1", 5001, fake_app)
    fake_app.app_context().push()
    server.serve_forever()

    write_to_cache(label, code)

    return code


@pytest.fixture
def authorization_code():
    return get_value_from_cache_or_browser("authorization-code", app.start_url)


@pytest.fixture
def secret_key(enable_test_app_key):
    return get_value_from_cache_or_browser(
        "secret-key", f"https://www.dropbox.com/developers/apps/info/{app.app_key}"
    )


@pytest.fixture
def refresh_token(authorization_code):
    from .endpoints import Login

    return (
        get_from_cache("refresh_token")
        or Login(authorization_code=authorization_code).get_refresh_token()
    )


@pytest.fixture
def logged_in_user(client: FlaskClient, refresh_token: str):
    from .datasource import User

    user_id = app.store.upsert(
        User(account_id="test-user", email="me@gmail.com", refresh_token=refresh_token)
    )
    with client.session_transaction() as session:
        session["user_id"] = user_id

    return list(app.store.fetch(User, "id = :user_id", user_id=user_id))[0]


def get_from_cache(label: str, exp: float = 1000000) -> str | None:
    cache_dir = os.path.join(os.path.dirname(__file__), ".test_cache")

    if not os.path.exists(cache_dir):
        os.mkdir(cache_dir)

    cache_file = os.path.join(cache_dir, label)
    if os.path.exists(cache_file):
        stat = os.stat(cache_file)
        if stat.st_mtime + exp > time.time():
            with open(cache_file, mode="r", encoding="utf8") as file:
                return file.read()

    return None


def write_to_cache(label: str, data: str):
    if not app.testing:
        return
    cache_dir = os.path.join(os.path.dirname(__file__), ".test_cache")

    if not os.path.exists(cache_dir):
        os.mkdir(cache_dir)

    cache_file = os.path.join(cache_dir, label)
    with open(cache_file, mode="w", encoding="utf8") as file:
        file.write(data)


exampe_raw_note: bytes = """
看病[1]してやる
===
{
  "language": "Japanese",
  "editsComplete": true,
  "terms": [
    {
      "attributes": {
        "reference": "看病",
        "marker": "1",
        "pronounce": "",
        "definition": "かんびょう 1 ［看病］\\n\\n\\n〈スル〉 病人の世話をすること．\\n",
        "hint": "",
        "clozes": [
          {
            "attributes": {
              "type": "recognize",
              "clozed": "",
              "schedule": {
                "lastAnsweredMinutes": 27162560,
                "nextDueMinutes": 29297068,
                "delayIntervalMinutes": 0,
                "intervalMinutes": 2134508,
                "isNew": false
              },
              "answers": [
                [
                  25985022,
                  [
                    "f",
                    2.8
                  ]
                ],
                [
                  26449582,
                  [
                    "f",
                    2.8
                  ]
                ],
                [
                  27162560,
                  [
                    "f",
                    3
                  ]
                ]
              ]
            }
          }
        ]
      }
    }
  ],
  "audioFileId": null
}
""".encode(
    "utf8"
)
