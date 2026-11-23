import datetime
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy import DateTime, TypeDecorator, create_engine, event, func, StaticPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from config.dependencies import get_settings
from database.models.base import Base

settings = get_settings()

SQLITE_DATABASE_URL = f"sqlite+aiosqlite:///{settings.PATH_TO_DB}"

sqlite_engine = create_async_engine(
    SQLITE_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False}
)


@event.listens_for(sqlite_engine.sync_engine, "connect")
def _register_sqlite_functions(dbapi_connection, connection_record):
    """Postgres-only server defaults (gen_random_uuid) do not exist in SQLite."""
    dbapi_connection.create_function(
        "gen_random_uuid", 0, lambda: uuid.uuid4().hex
    )


class UTCDateTime(TypeDecorator):
    """SQLite drops the timezone of DateTime(timezone=True) columns.

    The services compare these values with aware UTC datetimes, as they do
    with Postgres, so store UTC and give every value read back the UTC tzinfo.
    """

    impl = DateTime
    cache_ok = True

    class comparator_factory(DateTime.Comparator):
        def __add__(self, other):
            if isinstance(other, datetime.timedelta):
                modifier = f"+{int(other.total_seconds())} seconds"
                return func.datetime(self.expr, modifier, type_=UTCDateTime())
            return super().__add__(other)

    def process_bind_param(self, value, dialect):
        if value is not None and value.tzinfo is not None:
            value = value.astimezone(datetime.timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            value = value.replace(tzinfo=datetime.timezone.utc)
        return value


def use_utc_datetimes() -> None:
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if (
                isinstance(column.type, DateTime)
                and not isinstance(column.type, UTCDateTime)
            ):
                column.type = UTCDateTime()


AsyncSQliteSessionLocal = async_sessionmaker(
    bind=sqlite_engine,
    autoflush=False,
    expire_on_commit=False
)


sync_database_url = SQLITE_DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
sync_database_engine = create_engine(sync_database_url, echo=False)


async def get_sqlite_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSQliteSessionLocal() as session:
        yield session


@asynccontextmanager
async def get_sqlite_db_contextmanager() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSQliteSessionLocal() as session:
        yield session


async def reset_sqlite_database() -> None:
    use_utc_datetimes()
    async with sqlite_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
