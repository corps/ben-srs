from __future__ import annotations

import contextlib
import os
import threading
from functools import cached_property
from typing import (
    Any,
    Generator,
    ContextManager,
    Callable,
)

import dropbox  # type: ignore
import flask
from flask import Flask
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from pydantic import BaseModel
from pydantic.json import pydantic_encoder
from werkzeug.sansio.utils import get_current_url

from .datasource import Store


@contextlib.contextmanager
def override(**options) -> Generator[None, None, None]:
    old: dict[str, Any] = {}
    for k, v in options.items():
        old[k] = v
        if not hasattr(app, k):
            raise KeyError(f"Invalid app config {k}!")
        setattr(app, k, v)
    try:
        yield
    finally:
        for k, v in old.items():
            setattr(app, k, v)


class PydanticJSONProvider(DefaultJSONProvider):
    @staticmethod
    def default(i: Any) -> Any:
        if isinstance(i, BaseModel):
            return pydantic_encoder(i)
        return DefaultJSONProvider.default(i)


class App(Flask):
    store: Store | None = None
    json_provider_class = PydanticJSONProvider

    batch_size: int = 100
    app_key: str = "tlu6ta8q9mu0w01"
    store_path: str = "data/db.sqlite"
    max_upload_size: int = 1024 * 1024 * 50

    @cached_property
    def app_secret(self) -> str:
        if "APP_SECRET" in os.environ:
            return os.environ["APP_SECRET"]
        for path in [
            "/run/secrets/bensrs-secret",
            os.path.join(self.root_path, ".secret-key"),
        ]:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return f.read().rstrip()
        raise ValueError("Could not determine app secret!")

    @property
    def start_url(self) -> str:
        return (
            f"https://www.dropbox.com/oauth2/authorize?client_id={self.app_key}&"
            f"response_type=code&token_access_type=offline"
        )

    proto = os.environ.get("HOST_PROTO")

    def oauth_redirect_url(self, request: Any):
        if self.proto:
            return get_current_url(scheme=self.proto, host=request.host) + "authorize"
        return request.host_url + "authorize"

    def oauth_flow(self, request: flask.Request, session: dict, csrf: str):
        return dropbox.DropboxOAuth2Flow(
            consumer_key=self.app_key,
            consumer_secret=self.app_secret,
            redirect_uri=self.oauth_redirect_url(request),
            session=session,
            csrf_token_session_key=csrf,
            token_access_type="offline",
        )

    @contextlib.contextmanager
    def open_store(self) -> Generator[Store, None, None]:
        if self.store is not None:
            yield self.store
            return

        with Store.open(os.path.join(self.root_path, self.store_path)) as s:
            self.store = s
            try:
                yield self.store
            finally:
                self.store = None

    def __init__(self):
        super(App, self).__init__(
            __name__,
            static_url_path="",
            static_folder="docs",
            root_path=os.path.abspath(os.path.join(os.path.dirname(__file__))),
        )

        self.secret_key = self.app_secret
        self.around_request(self.open_store)

    def around_request(self, context: Callable[[], ContextManager]) -> None:
        @self.before_request
        def enter_context():
            assert state.c is None
            state.c = context()
            state.c.__enter__()

        @self.teardown_request
        def exit_context(exc: BaseException | None):
            if state.c is not None:
                state.c.__exit__(type(exc) if exc else None, exc, None)
            state.c = None


class State(threading.local):
    c: ContextManager | None = None


state = State()

app: App = App()
CORS(app, resources={r"/login": {"origins": "*"}}, supports_credentials=True)
