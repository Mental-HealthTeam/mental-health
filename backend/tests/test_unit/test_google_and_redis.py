from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import status

from auth.google_provider import GoogleAuthProvider
from database.models.models import AuthProvider
from exceptions.auth_provider import InvalidCredentialsError
from exceptions.base import AppError
from redis_storage.redis_storage import RedisSessionStorage

VERIFY = "auth.google_provider.id_token.verify_oauth2_token"


def good_payload(**overrides):
    payload = {
        "sub": "google-123",
        "email": "user@example.com",
        "email_verified": True,
        "name": "Ivan",
        "picture": "https://img.test/a.png",
    }
    payload.update(overrides)
    return payload


async def test_google_authenticate_success():
    provider = GoogleAuthProvider(client_id="client-id")

    with patch(VERIFY, return_value=good_payload()) as verify:
        identity = await provider.authenticate({"credential": "token"})

    assert identity.provider == AuthProvider.GOOGLE
    assert identity.subject == "google-123"
    assert identity.email == "user@example.com"
    assert identity.email_verified is True
    assert identity.name == "Ivan"
    assert identity.avatar_url == "https://img.test/a.png"
    assert verify.call_args.args[0] == "token"
    assert verify.call_args.args[2] == "client-id"


@pytest.mark.parametrize("credentials", [None, {}, {"credential": ""}])
async def test_google_authenticate_missing_credential(credentials):
    with pytest.raises(InvalidCredentialsError):
        await GoogleAuthProvider("client-id").authenticate(credentials)


async def test_google_authenticate_invalid_token():
    with patch(VERIFY, side_effect=ValueError("bad signature")):
        with pytest.raises(InvalidCredentialsError):
            await GoogleAuthProvider("client-id").authenticate({"credential": "t"})


@pytest.mark.parametrize(
    "payload",
    [
        good_payload(email_verified=False),
        good_payload(email_verified="true"),
        {"sub": "x", "email_verified": True},
        {"email": "user@example.com", "email_verified": True},
        good_payload(email="not-an-email"),
    ],
)
async def test_google_authenticate_rejects_bad_payloads(payload):
    with patch(VERIFY, return_value=payload):
        with pytest.raises(InvalidCredentialsError):
            await GoogleAuthProvider("client-id").authenticate({"credential": "t"})


async def test_google_authenticate_optional_profile_fields():
    payload = good_payload()
    payload.pop("name")
    payload.pop("picture")

    with patch(VERIFY, return_value=payload):
        identity = await GoogleAuthProvider("client-id").authenticate(
            {"credential": "t"}
        )

    assert identity.name is None
    assert identity.avatar_url is None


async def test_redis_storage_returns_recording_info():
    storage = RedisSessionStorage(redis_url="redis://test")
    client = MagicMock()
    client.hgetall = AsyncMock(
        return_value={"created_at": "1700000000", "message_count": "5"}
    )

    with patch.object(storage, "_get_redis_client", return_value=client):
        info = await storage.get_recording_info("chat-1")

    assert info == {"created_at": "1700000000", "message_count": "5"}
    client.hgetall.assert_awaited_once_with("chat:session:chat-1:meta")


async def test_redis_storage_missing_session():
    storage = RedisSessionStorage(redis_url="redis://test")
    client = MagicMock()
    client.hgetall = AsyncMock(return_value={})

    with patch.object(storage, "_get_redis_client", return_value=client):
        with pytest.raises(AppError) as error:
            await storage.get_recording_info("chat-1")

    assert error.value.status_code == status.HTTP_404_NOT_FOUND
    assert error.value.code == "RECORDING_SESSION_NOT_FOUND"
