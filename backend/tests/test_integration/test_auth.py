import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from fastapi.testclient import TestClient
from app.main import app
from routes import auth as auth_routes
from auth.dependencies import get_current_user
from database.models.models import User, UserRole
from app.schemas.auth import ExternalIdentity, ClientInfo, TokenPair, AuthProvider


@pytest.fixture
def auth_client():
    previous_overrides = app.dependency_overrides.copy()

    settings = SimpleNamespace(
        REFRESH_COOKIE="refresh_token",
        ACCESS_COOKIE="access_token",
        cors_origins_list=[],
    )

    app.dependency_overrides[auth_routes.get_settings] = lambda: settings
    app.dependency_overrides[auth_routes.get_db] = lambda: object()
    app.dependency_overrides[auth_routes.get_jwt_manager] = lambda: object()
    app.dependency_overrides[auth_routes.get_client_info] = (
        lambda: ClientInfo()
    )

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)


@pytest.fixture
def test_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        name="Test User",
        avatar_url=None,
        role=UserRole.CLIENT,
    )


@pytest.fixture
def token_pair():
    return TokenPair(
        access_token="test-access-token",
        refresh_token="test-refresh-token",
    )


def fake_set_auth_cookies(response, tokens, *args, **kwargs):
    response.set_cookie("access_token", tokens.access_token)
    response.set_cookie("refresh_token", tokens.refresh_token)


def fake_clear_auth_cookies(response, *args, **kwargs):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


# GET /api/auth/me

def test_get_me_returns_public_user(auth_client, test_user):
    app.dependency_overrides[get_current_user] = lambda: test_user

    response = auth_client.get("/api/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_user.id)
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name
    assert data["avatar_url"] is None
    assert data["role"] == UserRole.CLIENT.value
    assert "created_at" not in data


def test_get_me_without_authentication_returns_401(auth_client):
    response = auth_client.get("/api/auth/me")

    assert response.status_code == 401


# POST /api/auth/google

def test_google_login_returns_user_and_sets_cookies(
    auth_client, monkeypatch, test_user, token_pair
):
    identity = ExternalIdentity(
        provider=AuthProvider.GOOGLE,
        subject="google-user-123",
        email="test@example.com",
        email_verified=True,
        name="Test User",
        avatar_url=None,
    )

    provider = SimpleNamespace(authenticate=AsyncMock(return_value=identity))

    app.dependency_overrides[auth_routes.get_google_provider] = lambda: provider

    monkeypatch.setattr(
        auth_routes,
        "get_or_create_user",
        AsyncMock(return_value=test_user),
    )
    monkeypatch.setattr(
        auth_routes,
        "create_session",
        AsyncMock(return_value=token_pair),
    )
    monkeypatch.setattr(auth_routes, "set_auth_cookies", fake_set_auth_cookies)

    response = auth_client.post(
        "/api/auth/google",
        json={"credential": "fake-google-credential"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(test_user.id)
    assert response.json()["email"] == test_user.email
    assert response.cookies.get("access_token") == token_pair.access_token
    assert response.cookies.get("refresh_token") == token_pair.refresh_token
    provider.authenticate.assert_awaited_once()


def test_google_login_rejects_empty_credential(auth_client):
    app.dependency_overrides[auth_routes.get_google_provider] = (
        lambda: None
    )

    response = auth_client.post(
        "/api/auth/google",
        json={"credential": ""},
    )

    assert response.status_code == 422
# POST /api/auth/refresh

def test_refresh_rotates_tokens_and_sets_cookies(
    auth_client, monkeypatch, token_pair
):
    app.dependency_overrides[auth_routes.get_refresh_token] = (
        lambda: "old-refresh-token"
    )

    rotate_mock = AsyncMock(return_value=token_pair)
    monkeypatch.setattr(auth_routes, "rotate_session", rotate_mock)
    monkeypatch.setattr(auth_routes, "set_auth_cookies", fake_set_auth_cookies)

    response = auth_client.post("/api/auth/refresh")

    assert response.status_code == 204
    rotate_mock.assert_awaited_once()
    assert response.cookies.get("access_token") == token_pair.access_token
    assert response.cookies.get("refresh_token") == token_pair.refresh_token


def test_refresh_without_refresh_token_returns_401(auth_client):
    response = auth_client.post("/api/auth/refresh")

    assert response.status_code == 401


# POST /api/auth/logout

def test_logout_revokes_session_and_clears_cookies(
    auth_client, monkeypatch
):
    revoke_mock = AsyncMock()
    app.dependency_overrides[auth_routes.get_settings] = lambda: (
        SimpleNamespace(
            REFRESH_COOKIE="refresh_token",
            ACCESS_COOKIE="access_token",
            cors_origins_list=[],
        )
    )

    monkeypatch.setattr(auth_routes, "revoke_session", revoke_mock)
    monkeypatch.setattr(auth_routes, "clear_auth_cookies", fake_clear_auth_cookies)

    auth_client.cookies.set("refresh_token", "existing-refresh-token")
    response = auth_client.post("/api/auth/logout")

    assert response.status_code == 204
    revoke_mock.assert_awaited_once()
    assert "access_token" not in response.cookies
    assert "refresh_token" not in response.cookies


def test_logout_without_refresh_cookie_still_succeeds(
    auth_client, monkeypatch
):
    revoke_mock = AsyncMock()
    monkeypatch.setattr(auth_routes, "revoke_session", revoke_mock)
    monkeypatch.setattr(auth_routes, "clear_auth_cookies", fake_clear_auth_cookies)

    response = auth_client.post("/api/auth/logout")

    assert response.status_code == 204
    revoke_mock.assert_not_awaited()


# POST /api/auth/logout-all

def test_logout_all_revokes_sessions_and_clears_cookies(
    auth_client, monkeypatch
):
    app.dependency_overrides[auth_routes.get_refresh_token] = (
        lambda: "existing-refresh-token"
    )

    revoke_all_mock = AsyncMock()
    monkeypatch.setattr(
        auth_routes, "revoke_all_sessions", revoke_all_mock
    )
    monkeypatch.setattr(
        auth_routes, "clear_auth_cookies", fake_clear_auth_cookies
    )

    response = auth_client.post("/api/auth/logout-all")

    assert response.status_code == 204
    revoke_all_mock.assert_awaited_once()