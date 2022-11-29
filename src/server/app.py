from __future__ import annotations

import contextlib
import os
import tempfile
from functools import cached_property
from typing import (
    Any,
    Generator,
    ContextManager,
    Callable, BinaryIO,
)

from dropbox import Dropbox
from flask import Flask
from flask.json.provider import DefaultJSONProvider
from pydantic import BaseModel
from pydantic.json import pydantic_encoder

from .datasource import Store, FileMetadata
from .utils import iterable_to_stream


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

    app_key: str = "tlu6ta8q9mu0w01"
    store_path: str = "data/db.sqlite"
    blob_path: str = "data/blobs"

    @cached_property
    def app_secret(self):
        if "APP_SECRET" in os.environ:
            return os.environ["APP_SECRET"]
        if os.path.exists("/run/secrets/bensrs-secret"):
            with open("/run/secrets/bensrs-secret", "r") as f:
                return f.read()
        return ""

    def blob_file_path(self, blob_id: str) -> str:
        path = os.path.join(self.root_path, self.blob_path)
        if not os.path.exists(path):
            os.mkdir(path)
        return os.path.abspath(os.path.join(path, blob_id))


    @contextlib.contextmanager
    def write_cache_entry(self, blob_id: str) -> Generator[BinaryIO, None, None]:
        with tempfile.NamedTemporaryFile("wb", delete=False) as file:
            try:
                yield file
            except:
                file.delete = True
                raise
        os.replace(file.name, self.blob_file_path(blob_id))

    def read_cache_entry(self, blob_id: str) -> BinaryIO:
        return open(self.blob_file_path(blob_id), "rb")

    @contextlib.contextmanager
    def read_blob(self, metadata: FileMetadata, dropbox: Dropbox) -> Generator[BinaryIO, None, None]:
        if os.path.exists(self.blob_file_path(metadata.remote_id)):
            yield self.read_cache_entry(metadata.remote_id)
            return
        dropbox.files_download(
            path=metadata.path,
            rev=metadata.rev,
        )
        _, response = dropbox.files_download(metadata.path, metadata.rev)
        with contextlib.closing(response):
            yield iterable_to_stream(iterable=response.iter_content())

    @property
    def secret_key(self) -> str:
        return self.app_secret

    @property
    def start_url(self) -> str:
        return (
            f"https://www.dropbox.com/oauth2/authorize?client_id={self.app_key}&"
            f"response_type=code&token_access_type=offline"
        )

    @contextlib.contextmanager
    def open_store(self) -> Generator[None, None, None]:
        if self.store is not None:
            yield
            return

        with Store.open(self.store_path) as s:
            self.store = s
            try:
                yield
            finally:
                self.store = None

    def __init__(self):
        super(App, self).__init__(
            __name__,
            static_url_path="",
            static_folder="docs",
            root_path=os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..")
            )
        )

        self.around_request(self.open_store)

    def reset(self):
        for key in list(self.__dict__.keys()):
            self.__dict__.pop(key)
        self.__init__()

    def around_request(self, context: Callable[[], ContextManager]) -> None:
        c: ContextManager | None = None

        @self.before_request
        def enter_context():
            nonlocal c
            assert c is None
            c = context()
            c.__enter__()

        @self.teardown_request
        def exit_context(exc: BaseException | None):
            nonlocal c
            if c is not None:
                c.__exit__(type(exc) if exc else None, exc, None)
            c = None


app: App = App()
