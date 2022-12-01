from __future__ import annotations

import contextlib
from sqlite3 import Connection, connect, OperationalError
from typing import Callable, List, Any, Iterable, TypeVar, Type

from pydantic import BaseModel


def create_versions_table(connection: Connection) -> None:
    connection.execute("CREATE TABLE versions (version integer primary key)")


Model = TypeVar("Model", bound="Orm")
Self = TypeVar("Self", bound="Orm")


class Orm(BaseModel):
    @classmethod
    def from_row(cls: Type[Self], row: tuple) -> Self:
        return cls.parse_obj({k: v for k, v in zip(cls.__fields__.keys(), row)})


class User(Orm):
    id: int = -1
    account_id: str
    email: str
    refresh_token: str


def create_users_table(connection: Connection) -> None:
    connection.execute(
        "CREATE TABLE users ("
        "id integer primary key,"
        "account_id string not null UNIQUE,"
        "email string not null,"
        "refresh_token string not null"
        ")"
    )


class SyncCursor(Orm):
    id: int = -1
    user_id: int
    value: str = ""


def create_cursors_table(connection: Connection) -> None:
    connection.execute(
        "CREATE TABLE synccursors ("
        "id integer primary key,"
        "user_id integer not null UNIQUE,"
        "value string not null"
        ")"
    )


class Term(Orm):
    id: int = -1
    deleted: int = 0

    updated_at: int = 0
    due_next_minutes: int = 0

    user_id: int
    note_path: str = ""
    note_rev: str = ""
    note_id: str = ""

    language: str = ""
    reference: str = ""
    marker: str = ""
    definition: str = ""
    url: str = ""
    related: str = ""


def create_terms_table(connection: Connection) -> None:
    connection.execute(
        "CREATE TABLE terms ("
        "id integer primary key,"
        "deleted integer not null,"
        "updated_at integer not null,"
        "due_next_minutes integer not null,"
        "user_id integer not null,"
        "note_path string not null,"
        "note_rev string not null,"
        "note_id string not null,"
        "language string not null,"
        "reference string not null,"
        "marker string not null,"
        "definition string not null,"
        "url string not null,"
        "related string not null"
        ")"
    )

    connection.execute(
        "CREATE INDEX term_by_user_id_and_path ON terms (user_id, note_path)"
    )

    connection.execute(
        "CREATE INDEX term_by_user_id_and_note_id ON terms (user_id, note_id)"
    )

    connection.execute(
        "CREATE INDEX term_by_user_id_updated_at ON terms (user_id, updated_at)"
    )


migrations: List[Callable[[Connection], None]] = [
    create_versions_table,
    create_users_table,
    create_cursors_table,
    create_terms_table,
]


class Store:
    migrations: list[Callable[[Connection], None]]
    connection: Connection

    def __init__(
        self, connection: Connection, migrations: List[Callable[[Connection], None]]
    ) -> None:
        self.connection = connection
        self.migrations = migrations

    def migrate(self, to_version: int | None = None):
        if to_version is None:
            to_version = len(self.migrations)

        version = 0
        try:
            row = self.connection.execute(
                "SELECT version FROM versions ORDER BY version DESC LIMIT 1"
            ).fetchone()
            version = row[0]
        except OperationalError:
            pass

        for i in range(version, to_version):
            print(f"Running {self.migrations[i].__name__}...")
            with self.connection:
                self.migrations[i](self.connection)
                self.connection.execute("INSERT INTO versions VALUES (?)", (i + 1,))

    def _table_name_of(self, model: Type[Model] | Model) -> str:
        if not isinstance(model, type):
            model = type(model)
        return model.__name__.lower() + "s"

    def get(self, model: Type[Model], id: int) -> Model | None:
        for result in self.fetch(model, "id = :id", id=id):
            return result
        return None

    def fetch(
        self,
        model: Type[Model],
        *conditions: Any,
        limit: int | None = None,
        order_by: str | None = None,
        **params: Any,
    ) -> Iterable[Model]:
        column_names_joined = ", ".join(model.__fields__.keys())
        condition = " AND ".join(conditions) or "TRUE"
        limit_clause = ""
        order_clause = ""
        if limit is not None:
            limit_clause = f" LIMIT {limit}"
        if order_by is not None:
            order_clause = f" ORDER BY {order_by}"

        cursor = self.connection.execute(
            f"SELECT {column_names_joined} FROM {self._table_name_of(model)} WHERE {condition}{order_clause}{limit_clause}",
            params,
        )
        for row in cursor:
            yield model.from_row(row)

    def upsert(self, model: Model) -> int | None:
        inserts = model.dict(exclude={"id"} if "id" not in model.__fields_set__ else {})
        updates = model.dict(exclude_unset=True, exclude={"id"})
        insert_columns_clause = ", ".join(inserts.keys())
        insert_values_clause = ", ".join(f":{k}" for k in inserts.keys())
        update_clause = ", ".join(f"{k} = :{k}" for k in updates.keys())

        result = self.connection.execute(
            f"INSERT INTO {self._table_name_of(type(model))} ({insert_columns_clause}) VALUES ({insert_values_clause}) "
            f"ON CONFLICT DO UPDATE SET {update_clause}",
            inserts,
        )

        if result.lastrowid > 0:
            return result.lastrowid
        else:
            if "id" in inserts:
                return inserts["id"]
            else:
                for val in self.fetch(type(model), *[f"{k} = :{k}" for k in inserts.keys()], **inserts):
                    return getattr(val, 'id')
                raise AttributeError("Could not determine id of upserted row?")

    def delete(self, model: Type[Model] | Model, *conditions: Any, **params: Any):
        if not isinstance(model, type) and hasattr(model, "id"):
            conditions = ("id = :id", *conditions)
            params = dict(id=getattr(model, "id"), **params)
        condition_clause = " AND ".join(conditions)
        self.connection.execute(
            f"DELETE FROM {self._table_name_of(model)} WHERE {condition_clause}", params
        )

    @classmethod
    @contextlib.contextmanager
    def open(cls, file_name: str):
        connection = connect(file_name, isolation_level="DEFERRED")
        connection.execute("PRAGMA journal_mode=wal")
        try:
            yield Store(connection, migrations)
        finally:
            connection.close()


def test_migrations():
    with Store.open(":memory:") as store:
        store.migrate(1)
        store.migrate(2)


def test_delete():
    store: Store
    with Store.open(":memory:") as store:
        store.migrate()

        store.upsert(User(account_id="abc", email="email@you", refresh_token="fresh"))
        store.upsert(User(account_id="def", email="email@you", refresh_token="fresh"))
        store.upsert(
            User(account_id="ghi", email="email@you", refresh_token="not-fresh")
        )
        store.upsert(User(account_id="jkl", email="email@you", refresh_token="fresh"))

        assert len(list(store.fetch(User))) == 4
        store.delete(
            User,
            "account_id > :left",
            "account_id < :right",
            "refresh_token = :fresh",
            left="abc",
            right="jkl",
            fresh="fresh",
        )
        assert [u.account_id for u in store.fetch(User)] == ["abc", "ghi", "jkl"]


def test_upsert():
    store: Store
    with Store.open(":memory:") as store:
        store.migrate()

        assert store.get(User, 1) is None
        assert (
            store.upsert(
                User(
                    account_id="abc",
                    refresh_token="first-token",
                    email="",
                ),
            )
            == 1
        )
        assert store.get(User, 1).refresh_token == "first-token"
        assert (
            store.upsert(
                User(
                    account_id="abc",
                    refresh_token="second-token",
                    email="",
                ),
            )
            == 1
        )
        assert store.get(User, 1).refresh_token == "second-token"
        assert (
            store.upsert(
                User(
                    account_id="def",
                    refresh_token="third-token",
                    email="aaa",
                ),
            )
            == 2
        )
        assert store.get(User, 1).refresh_token == "second-token"
        assert store.get(User, 2).refresh_token == "third-token"
