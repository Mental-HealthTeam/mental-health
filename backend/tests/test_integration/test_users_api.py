from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    SymptomCode,
    User,
    UserRole,
    UserSymptomCode,
)


ME = "/api/users/me"
AVATAR = "/api/users/me/avatar"


def png_file(data: bytes, name: str = "avatar.png", kind: str = "image/png"):
    return {"file": (name, data, kind)}


async def test_get_profile_client(
    client, client_user, client_headers, db_session
):
    client_user.telegram = "my_user"
    db_session.add_all([
        UserSymptomCode(user_id=client_user.id, symptom_code=SymptomCode.STRESS),
        UserSymptomCode(user_id=client_user.id, symptom_code=SymptomCode.ANXIETY),
    ])
    await db_session.commit()

    response = await client.get(ME, headers=client_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(client_user.id)
    assert body["email"] == client_user.email
    assert body["role"] == "client"
    assert body["telegram"] == "my_user"
    assert body["topics"] == ["anxiety", "stress"]
    assert body["meet_link"] is None


async def test_get_profile_psychologist_has_meet_link(
    client, psychologist, psychologist_headers
):
    response = await client.get(ME, headers=psychologist_headers)

    assert response.status_code == 200
    assert response.json()["meet_link"] == psychologist.meet_link


async def test_get_profile_unauthorized(client):
    response = await client.get(ME)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_update_profile_success(
    client, client_user, client_headers, reload
):
    response = await client.patch(
        ME,
        json={"name": "New Name", "telegram": "new_name", "topics": ["sleep"]},
        headers=client_headers,
    )

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["telegram"] == "new_name"
    assert response.json()["topics"] == ["sleep"]
    await reload(client_user)
    assert client_user.name == "New Name"
    assert client_user.telegram == "new_name"


@pytest.mark.parametrize("value", ["@my_user", "my_user"])
async def test_update_profile_telegram_at_sign_removed(
    client, client_headers, value
):
    response = await client.patch(
        ME, json={"telegram": value}, headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["telegram"] == "my_user"


@pytest.mark.parametrize("value", ["", "   "])
async def test_update_profile_blank_telegram_becomes_none(
    client, client_user, client_headers, db_session, value
):
    client_user.telegram = "old_name"
    await db_session.commit()

    response = await client.patch(
        ME, json={"telegram": value}, headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["telegram"] is None


@pytest.mark.parametrize("value", [None])
async def test_update_profile_none_telegram(
    client, client_user, client_headers, db_session, value, make_user
):
    client_user.telegram = "old_name"
    await make_user()
    await db_session.commit()

    response = await client.patch(
        ME, json={"telegram": value}, headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["telegram"] is None


async def test_update_profile_topics_are_replaced(
    client, client_user, client_headers, db_session, fetch
):
    db_session.add_all([
        UserSymptomCode(user_id=client_user.id, symptom_code=SymptomCode.STRESS),
        UserSymptomCode(user_id=client_user.id, symptom_code=SymptomCode.ANXIETY),
    ])
    await db_session.commit()

    response = await client.patch(
        ME, json={"topics": ["burnout"]}, headers=client_headers
    )

    assert response.json()["topics"] == ["burnout"]
    rows = await fetch(select(UserSymptomCode))
    assert [row.symptom_code for row in rows] == [SymptomCode.BURNOUT]


async def test_update_profile_empty_topics_clears_all(
    client, client_user, client_headers, db_session
):
    db_session.add(
        UserSymptomCode(user_id=client_user.id, symptom_code=SymptomCode.STRESS)
    )
    await db_session.commit()

    response = await client.patch(
        ME, json={"topics": []}, headers=client_headers
    )

    assert response.json()["topics"] == []


async def test_update_profile_duplicate_topics_are_deduplicated(
    client, client_headers
):
    response = await client.patch(
        ME, json={"topics": ["burnout", "burnout"]}, headers=client_headers
    )

    assert response.status_code == 200
    assert response.json()["topics"] == ["burnout"]


async def test_update_profile_partial_keeps_other_fields(
    client, client_user, client_headers, db_session
):
    client_user.telegram = "keep_me"
    await db_session.commit()

    response = await client.patch(
        ME, json={"name": "Only Name"}, headers=client_headers
    )

    assert response.json()["name"] == "Only Name"
    assert response.json()["telegram"] == "keep_me"


@pytest.mark.parametrize("value", ["abc", "bad name!", "a" * 33])
async def test_update_profile_invalid_telegram(client, client_headers, value):
    response = await client.patch(
        ME, json={"telegram": value}, headers=client_headers
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    assert response.json()["errors"][0]["field"] == "telegram"


@pytest.mark.parametrize(
    "body",
    [{"role": "admin"}, {"meet_link": "https://x.y"}, {"email": "a@b.co"}],
)
async def test_update_profile_forbidden_fields(
    client, client_user, client_headers, reload, body
):
    response = await client.patch(ME, json=body, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    await reload(client_user)
    assert client_user.role == UserRole.CLIENT


async def test_update_profile_unknown_topic(client, client_headers):
    response = await client.patch(
        ME, json={"topics": ["not_a_topic"]}, headers=client_headers
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_update_profile_telegram_already_taken(
    client, make_user, client_headers
):
    await make_user(telegram="taken_name")

    response = await client.patch(
        ME, json={"telegram": "taken_name"}, headers=client_headers
    )

    assert response.status_code == 409
    assert response.json()["code"] == "TELEGRAM_ALREADY_TAKEN"


async def test_update_profile_db_error(client, client_headers):
    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.patch(
            ME, json={"name": "Oops"}, headers=client_headers
        )

    assert response.status_code == 500
    assert response.json()["code"] == "USER_PROFILE_UPDATE_FAILED"


async def test_update_profile_unauthorized(client):
    response = await client.patch(ME, json={"name": "x"})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_upload_avatar_success(
    client, client_user, client_headers, make_image, settings, reload
):
    response = await client.post(
        AVATAR, files=png_file(make_image("PNG")), headers=client_headers
    )

    assert response.status_code == 200
    url = response.json()["avatar_url"]
    assert url.startswith(settings.AVATAR_STORAGE_URL)
    filename = url.removeprefix(settings.AVATAR_STORAGE_URL)
    assert filename.startswith(f"{client_user.id}_")
    assert (Path(settings.AVATAR_STORAGE_DIR) / filename).exists()
    await reload(client_user)
    assert client_user.avatar_url == url


async def test_upload_avatar_replaces_old_file(
    client, client_headers, make_image, settings
):
    first = await client.post(
        AVATAR, files=png_file(make_image("PNG")), headers=client_headers
    )
    second = await client.post(
        AVATAR, files=png_file(make_image("JPEG"), "a.jpg", "image/jpeg"),
        headers=client_headers,
    )

    folder = Path(settings.AVATAR_STORAGE_DIR)
    old = first.json()["avatar_url"].removeprefix(settings.AVATAR_STORAGE_URL)
    new = second.json()["avatar_url"].removeprefix(settings.AVATAR_STORAGE_URL)
    assert not (folder / old).exists()
    assert (folder / new).exists()


async def test_upload_avatar_unsupported_format(
    client, client_headers, make_image
):
    response = await client.post(
        AVATAR, files=png_file(make_image("GIF"), "a.gif", "image/gif"),
        headers=client_headers,
    )

    assert response.status_code == 400
    assert response.json()["code"] == "AVATAR_UNSUPPORTED_FORMAT"


async def test_upload_avatar_empty_file(client, client_headers):
    response = await client.post(
        AVATAR, files=png_file(b""), headers=client_headers
    )

    assert response.status_code == 400
    assert response.json()["code"] == "AVATAR_EMPTY"


async def test_upload_avatar_not_an_image(client, client_headers):
    response = await client.post(
        AVATAR, files=png_file(b"just some text"), headers=client_headers
    )

    assert response.status_code == 400
    assert response.json()["code"] == "AVATAR_INVALID_IMAGE"


async def test_upload_avatar_too_large(client, client_headers, settings):
    data = b"0" * (settings.MAX_AVATAR_UPLOAD_SIZE + 1)

    response = await client.post(
        AVATAR, files=png_file(data), headers=client_headers
    )

    assert response.status_code == 413
    assert response.json()["code"] == "AVATAR_TOO_LARGE"


async def test_upload_avatar_dimensions_too_large(
    client, client_headers, make_image
):
    response = await client.post(
        AVATAR, files=png_file(make_image("PNG", (1001, 1001))),
        headers=client_headers,
    )

    assert response.status_code == 400
    assert response.json()["code"] == "AVATAR_DIMENSIONS_TOO_LARGE"


async def test_upload_avatar_db_error_removes_new_file(
    client, client_user, client_headers, make_image, settings, reload
):
    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(
            AVATAR, files=png_file(make_image("PNG")), headers=client_headers
        )

    assert response.status_code == 500
    assert response.json()["code"] == "AVATAR_UPLOAD_FAILED"
    folder = Path(settings.AVATAR_STORAGE_DIR)
    assert list(folder.glob("*")) == []
    await reload(client_user)
    assert client_user.avatar_url is None


async def test_upload_avatar_missing_file(client, client_headers):
    response = await client.post(AVATAR, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_upload_avatar_unauthorized(client, make_image):
    response = await client.post(AVATAR, files=png_file(make_image("PNG")))

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_delete_avatar_success(
    client, client_user, client_headers, make_image, settings, reload
):
    uploaded = await client.post(
        AVATAR, files=png_file(make_image("PNG")), headers=client_headers
    )
    filename = uploaded.json()["avatar_url"].removeprefix(
        settings.AVATAR_STORAGE_URL
    )

    response = await client.delete(AVATAR, headers=client_headers)

    assert response.status_code == 200
    assert response.json()["avatar_url"] is None
    assert not (Path(settings.AVATAR_STORAGE_DIR) / filename).exists()
    await reload(client_user)
    assert client_user.avatar_url is None


async def test_delete_avatar_when_none(client, client_headers):
    response = await client.delete(AVATAR, headers=client_headers)

    assert response.status_code == 200
    assert response.json()["avatar_url"] is None


async def test_delete_avatar_db_error_keeps_file(
    client, client_headers, make_image, settings
):
    uploaded = await client.post(
        AVATAR, files=png_file(make_image("PNG")), headers=client_headers
    )
    filename = uploaded.json()["avatar_url"].removeprefix(
        settings.AVATAR_STORAGE_URL
    )

    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.delete(AVATAR, headers=client_headers)

    assert response.status_code == 500
    assert response.json()["code"] == "AVATAR_DELETE_FAILED"
    assert (Path(settings.AVATAR_STORAGE_DIR) / filename).exists()


async def test_delete_avatar_unauthorized(client):
    response = await client.delete(AVATAR)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"
