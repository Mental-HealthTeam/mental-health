import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from database.models.models import (
    AuthProvider,
    AuthSession,
    User,
    UserIdentity,
    UserRole,
)
from exceptions.auth_provider import InvalidCredentialsError

GOOGLE = "/api/auth/google"
ME = "/api/auth/me"
REFRESH = "/api/auth/refresh"
LOGOUT = "/api/auth/logout"
LOGOUT_ALL = "/api/auth/logout-all"
BODY = {"credential": "google-token"}


async def test_google_login_creates_user_and_session(client, fetch):
    response = await client.post(GOOGLE, json=BODY)

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    users = await fetch(select(User))
    assert len(users) == 1
    assert users[0].role == UserRole.CLIENT
    identities = await fetch(select(UserIdentity))
    assert len(identities) == 1
    assert identities[0].provider == AuthProvider.GOOGLE
    assert identities[0].provider_subject == "google-sub-1"
    sessions = await fetch(select(AuthSession))
    assert len(sessions) == 1
    assert sessions[0].revoked_at is None
    cookies = response.headers.get_list("set-cookie")
    assert any(cookie.startswith("access=") for cookie in cookies)
    assert any(cookie.startswith("refresh=") for cookie in cookies)


async def test_google_login_passes_credential_to_provider(client, fake_google):
    await client.post(GOOGLE, json=BODY)

    assert fake_google.calls == [{"credential": "google-token"}]


async def test_google_login_existing_identity_reuses_user(client, fetch):
    await client.post(GOOGLE, json=BODY)
    await client.post(GOOGLE, json=BODY)

    assert len(await fetch(select(User))) == 1
    assert len(await fetch(select(UserIdentity))) == 1
    assert len(await fetch(select(AuthSession))) == 2
    user = (await fetch(select(User)))[0]
    assert user.last_login_at is not None


async def test_google_login_links_identity_to_existing_user_by_email(
    client, make_user, fetch
):
    existing = await make_user(email="user@example.com")

    response = await client.post(GOOGLE, json=BODY)

    assert response.status_code == 200
    users = await fetch(select(User))
    assert len(users) == 1
    identities = await fetch(select(UserIdentity))
    assert len(identities) == 1
    assert identities[0].user_id == existing.id


async def test_google_login_keeps_existing_avatar(client, make_user, fetch):
    await make_user(
        email="user@example.com", avatar_url="https://my.avatar/1.png"
    )

    await client.post(GOOGLE, json=BODY)

    user = (await fetch(select(User)))[0]
    assert user.avatar_url == "https://my.avatar/1.png"


async def test_google_login_invalid_credentials(client, fake_google, fetch):
    fake_google.error = InvalidCredentialsError("bad token")

    response = await client.post(GOOGLE, json=BODY)

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"
    assert response.headers.get_list("set-cookie") == []
    assert await fetch(select(User)) == []


async def test_google_login_origin_not_allowed(client, fake_google):
    response = await client.post(
        GOOGLE, json=BODY, headers={"Origin": "https://evil.example"}
    )

    assert response.status_code == 403
    assert response.json()["code"] == "ORIGIN_NOT_ALLOWED"
    assert fake_google.calls == []


async def test_google_login_allowed_origin(client):
    response = await client.post(
        GOOGLE, json=BODY, headers={"Origin": "http://localhost"}
    )

    assert response.status_code == 200


async def test_google_login_empty_body(client):
    response = await client.post(GOOGLE, json={})

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert response.json()["errors"]


async def test_me_success(client, client_user, client_headers):
    response = await client.get(ME, headers=client_headers)

    assert response.status_code == 200
    assert response.json()["id"] == str(client_user.id)
    assert response.json()["email"] == client_user.email


async def test_me_no_cookie(client):
    response = await client.get(ME)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_garbage_token(client):
    response = await client.get(ME, headers={"Cookie": "access=not-a-jwt"})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_refresh_token_is_not_access_token(
    client, client_user, jwt_manager
):
    token = jwt_manager.create_access_token(
        data={"sub": str(client_user.id), "type": "refresh"}
    )

    response = await client.get(ME, headers={"Cookie": f"access={token}"})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_expired_token(client, client_user, jwt_manager):
    token = jwt_manager.create_access_token(
        data={"sub": str(client_user.id), "type": "access"},
        expires_delta=timedelta(seconds=-10),
    )

    response = await client.get(ME, headers={"Cookie": f"access={token}"})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_me_unknown_user(client, jwt_manager):
    token = jwt_manager.create_access_token(
        data={"sub": str(uuid.uuid4()), "type": "access"}
    )

    response = await client.get(ME, headers={"Cookie": f"access={token}"})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_refresh_rotates_session(client, fetch):
    await client.post(GOOGLE, json=BODY)
    old_refresh = client.cookies.get("refresh")

    response = await client.post(REFRESH)

    assert response.status_code == 204
    assert client.cookies.get("refresh") != old_refresh
    sessions = await fetch(select(AuthSession).order_by(AuthSession.created_at))
    assert len(sessions) == 2
    old, new = sorted(sessions, key=lambda s: s.revoked_at is None)
    assert old.revoked_at is not None
    assert old.replaced_by == new.jti
    assert new.family_id == old.family_id
    assert new.revoked_at is None


async def test_refresh_without_cookie(client):
    response = await client.post(REFRESH)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_refresh_garbage_token(client):
    response = await client.post(
        REFRESH, headers={"Cookie": "refresh=garbage"}
    )

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


async def test_refresh_reuse_revokes_whole_family(client, fetch):
    await client.post(GOOGLE, json=BODY)
    first_refresh = client.cookies.get("refresh")
    await client.post(REFRESH)
    second_refresh = client.cookies.get("refresh")

    reuse = await client.post(
        REFRESH, headers={"Cookie": f"refresh={first_refresh}"}
    )

    assert reuse.status_code == 401
    assert reuse.json()["code"] == "INVALID_TOKEN"
    sessions = await fetch(select(AuthSession))
    assert all(session.revoked_at is not None for session in sessions)
    after = await client.post(
        REFRESH, headers={"Cookie": f"refresh={second_refresh}"}
    )
    assert after.status_code == 401


async def test_refresh_expired_session(client, fetch, db_session):
    await client.post(GOOGLE, json=BODY)
    session = (await fetch(select(AuthSession)))[0]
    session.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    await db_session.commit()

    response = await client.post(REFRESH)

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


async def test_refresh_session_not_found(client, client_user, jwt_manager):
    token = jwt_manager.create_refresh_token(
        data={
            "sub": str(client_user.id),
            "family_id": str(uuid.uuid4()),
            "jti": str(uuid.uuid4()),
            "type": "refresh",
        }
    )

    response = await client.post(
        REFRESH, headers={"Cookie": f"refresh={token}"}
    )

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"


async def test_refresh_origin_not_allowed(client):
    await client.post(GOOGLE, json=BODY)

    response = await client.post(
        REFRESH, headers={"Origin": "https://evil.example"}
    )

    assert response.status_code == 403
    assert response.json()["code"] == "ORIGIN_NOT_ALLOWED"


async def test_logout_revokes_session(client, fetch):
    await client.post(GOOGLE, json=BODY)

    response = await client.post(LOGOUT)

    assert response.status_code == 204
    session = (await fetch(select(AuthSession)))[0]
    assert session.revoked_at is not None
    again = await client.post(REFRESH)
    assert again.status_code == 401


async def test_logout_without_cookie(client, fetch):
    response = await client.post(LOGOUT)

    assert response.status_code == 204
    assert await fetch(select(AuthSession)) == []


async def test_logout_origin_not_allowed(client):
    response = await client.post(
        LOGOUT, headers={"Origin": "https://evil.example"}
    )

    assert response.status_code == 403
    assert response.json()["code"] == "ORIGIN_NOT_ALLOWED"


async def test_logout_all_revokes_every_session(client, fake_google, fetch):
    await client.post(GOOGLE, json=BODY)
    await client.post(GOOGLE, json=BODY)
    fake_google.subject = "google-sub-2"
    fake_google.email = "other@example.com"
    other = client.__class__(
        transport=client._transport, base_url="http://test"
    )
    await other.post(GOOGLE, json=BODY)
    await other.aclose()
    users = {u.email: u for u in await fetch(select(User))}

    response = await client.post(LOGOUT_ALL)

    assert response.status_code == 204
    sessions = await fetch(select(AuthSession))
    mine = [s for s in sessions if s.user_id == users["user@example.com"].id]
    others = [s for s in sessions if s.user_id == users["other@example.com"].id]
    assert len(mine) == 2
    assert all(s.revoked_at is not None for s in mine)
    assert all(s.revoked_at is None for s in others)


async def test_logout_all_without_cookie(client):
    response = await client.post(LOGOUT_ALL)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_logout_all_garbage_token(client):
    response = await client.post(
        LOGOUT_ALL, headers={"Cookie": "refresh=garbage"}
    )

    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_TOKEN"
