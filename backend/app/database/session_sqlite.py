from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from config.dependencies import get_settings

settings = get_settings()

SQLITE_DATABASE_URL = f"sqlite+aiosqlite:///{settings.PATH_TO_DB}"

sqlite_engine = create_async_engine(
    SQLITE_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False}
)

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
