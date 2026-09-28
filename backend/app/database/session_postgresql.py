from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from config.dependencies import get_settings

settings = get_settings()

POSTGRESQL_DATABASE_URL = (f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}@"
                           f"{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")

postgresql_engine = create_async_engine(POSTGRESQL_DATABASE_URL, echo=False)

AsyncPostgresqlSessionLocal = async_sessionmaker(
    bind=postgresql_engine,
    autoflush=False,
    expire_on_commit=False
)


sync_database_url = POSTGRESQL_DATABASE_URL.replace("postgresql+asyncpg", "postgresql")
sync_database_engine = create_engine(sync_database_url, echo=False)


async def get_postgresql_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncPostgresqlSessionLocal() as session:
        yield session


@asynccontextmanager
async def get_postgresql_db_contextmanager() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncPostgresqlSessionLocal() as session:
        yield session
