import pytest
import pytest_asyncio

from config.dependencies import get_settings
from database import (
    get_db_contextmanager,
    reset_database
)


def pytest_configure(config):
    config.addinivalue_line(
        "markers", "e2e: End-to-end tests"
    )
    config.addinivalue_line(
        "markers", "unit: Unit tests"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests"
    )


def pytest_collection_modify_items(config, items):
    for item in items:
        if "test_integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        if 'test_e2e' in str(item.fspath):
            item.add_marker(pytest.mark.e2e)


@pytest_asyncio.fixture(scope="session")
async def reset_db(request):
    if "e2e" in request:
        yield
    else:
        await reset_database()
        yield


@pytest_asyncio.fixture(scope="session")
async def reset_db_once_for_e2e(request):
    await reset_database()


@pytest.fixture(scope="session")
def settings():
    return get_settings()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with get_db_contextmanager() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def e2e_db_session():
    async with get_db_contextmanager() as session:
        yield session
