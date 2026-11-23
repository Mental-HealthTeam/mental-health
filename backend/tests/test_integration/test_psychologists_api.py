import uuid
from unittest.mock import AsyncMock, patch

import pytest
from freezegun import freeze_time
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    Gender,
    PsychologistStatus,
    UserRole,
)

LIST = "/api/psychologists"
MY_PROFILE = "/api/psychologists/me/profile"
PAYOUT = "/api/psychologists/me/payout-details"


async def test_list_only_active_psychologists(client, make_psychologist):
    await make_psychologist()
    await make_psychologist()
    await make_psychologist(status=PsychologistStatus.FROZEN)

    response = await client.get(LIST)

    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    item = items[0]
    for field in (
        "psychologist_id", "full_name", "avatar_url", "experience_years",
        "price_per_hour", "methods", "topics", "mock_slots",
    ):
        assert field in item
    assert sorted(item["topics"]) == ["anxiety", "stress"]


async def test_list_pagination(client, make_psychologist):
    created = [await make_psychologist() for _ in range(7)]
    ids = sorted(str(p.psychologist_id) for p in created)

    default = await client.get(LIST)
    page = await client.get(LIST, params={"limit": 2, "offset": 2})

    assert len(default.json()) == 5
    assert [i["psychologist_id"] for i in page.json()] == ids[2:4]


@pytest.mark.parametrize(
    "params",
    [{"limit": 0}, {"limit": 101}, {"offset": -1}],
)
async def test_list_invalid_pagination(client, params):
    response = await client.get(LIST, params=params)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_list_filter_by_topics_ranks_by_matches(
    client, make_psychologist
):
    both = await make_psychologist(topics=("anxiety", "stress"))
    one = await make_psychologist(topics=("anxiety",))
    await make_psychologist(topics=("sleep",))

    response = await client.get(
        LIST, params={"symptom_codes": ["anxiety", "stress"]}
    )

    ids = [i["psychologist_id"] for i in response.json()]
    assert ids == [str(both.psychologist_id), str(one.psychologist_id)]


async def test_list_filter_by_price_is_inclusive(client, make_psychologist):
    cheap = await make_psychologist(price="500")
    middle = await make_psychologist(price="1000")
    top = await make_psychologist(price="1500")

    exact = await client.get(LIST, params={"price_from": 1000, "price_to": 1000})
    from_600 = await client.get(LIST, params={"price_from": 600})

    assert [i["psychologist_id"] for i in exact.json()] == [
        str(middle.psychologist_id)
    ]
    ids = {i["psychologist_id"] for i in from_600.json()}
    assert ids == {str(middle.psychologist_id), str(top.psychologist_id)}
    assert str(cheap.psychologist_id) not in ids


async def test_list_invalid_price_range(client):
    response = await client.get(
        LIST, params={"price_from": 2000, "price_to": 1000}
    )

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_PRICE_RANGE"


async def test_list_available_on_today_and_tomorrow(
    client, make_psychologist
):
    from datetime import datetime, timezone

    def at(day: int):
        return datetime(2026, 12, day, 15, 0, tzinfo=timezone.utc)

    today = await make_psychologist(slots=[at(1)])
    tomorrow = await make_psychologist(slots=[at(2)])
    await make_psychologist(slots=[at(10)])

    with freeze_time("2026-12-01 10:00:00"):
        today_response = await client.get(LIST, params={"available_on": "today"})
        tomorrow_response = await client.get(
            LIST, params={"available_on": "tomorrow"}
        )

    assert [i["psychologist_id"] for i in today_response.json()] == [
        str(today.psychologist_id)
    ]
    assert [i["psychologist_id"] for i in tomorrow_response.json()] == [
        str(tomorrow.psychologist_id)
    ]


async def test_list_lang_en_with_fallback(client, make_psychologist):
    await make_psychologist(full_name="Український", full_name_eng="English")
    await make_psychologist(full_name="Тільки укр", full_name_eng=None)

    uk = await client.get(LIST)
    en = await client.get(LIST, params={"lang": "en"})

    assert {i["full_name"] for i in uk.json()} == {"Український", "Тільки укр"}
    assert {i["full_name"] for i in en.json()} == {"English", "Тільки укр"}


async def test_list_hides_taken_and_past_slots(
    client, make_psychologist, make_booking, other_client, slot
):
    past = slot(days=-1, hour=10)
    taken = slot(days=2, hour=10)
    free = slot(days=3, hour=10)
    psychologist = await make_psychologist(slots=[past, taken, free])
    await make_booking(other_client, psychologist, selected_time=taken)

    response = await client.get(LIST)

    times = [s["time"] for s in response.json()[0]["mock_slots"]]
    assert len(times) == 1
    assert times[0].startswith(free.strftime("%Y-%m-%dT%H:00"))


@pytest.mark.parametrize(
    "params",
    [{"symptom_codes": "nope"}, {"available_on": "yesterday"}],
)
async def test_list_invalid_params(client, params):
    response = await client.get(LIST, params=params)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_get_psychologist_success(client, psychologist, settings):
    response = await client.get(f"{LIST}/{psychologist.psychologist_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["psychologist_id"] == str(psychologist.psychologist_id)
    assert body["is_verified"] is True
    assert body["session_minutes"] == settings.SESSION_DURATION_MIN
    assert sorted(body["topics"]) == ["anxiety", "stress"]
    assert body["experience_years"] == 5
    assert body["languages"] == ["uk"]
    assert body["certificates"] == [{"title": "Сертифікат"}]
    for field in ("title", "price_per_hour", "methods", "bio", "reviews",
                  "mock_slots", "avatar_url"):
        assert field in body
    for private in ("iban", "tax_id", "meet_link", "account_name"):
        assert private not in body


async def test_get_psychologist_lang_en(client, make_psychologist):
    psychologist = await make_psychologist()

    response = await client.get(
        f"{LIST}/{psychologist.psychologist_id}", params={"lang": "en"}
    )

    body = response.json()
    assert body["full_name"] == "Test Psychologist"
    assert body["title"] == "Clinical psychologist"
    assert body["bio"]["about"] == "About"
    assert body["certificates"] == [{"title": "Certificate"}]


async def test_get_psychologist_lang_fallback_to_ukrainian(
    client, make_psychologist
):
    psychologist = await make_psychologist(methods_eng=())

    response = await client.get(
        f"{LIST}/{psychologist.psychologist_id}", params={"lang": "en"}
    )

    assert response.json()["methods"] == ["КПТ"]


async def test_get_psychologist_not_found(client):
    response = await client.get(f"{LIST}/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["code"] == "PSYCHOLOGIST_NOT_FOUND"


async def test_get_psychologist_not_active(client, make_psychologist):
    frozen = await make_psychologist(status=PsychologistStatus.FROZEN)

    response = await client.get(f"{LIST}/{frozen.psychologist_id}")

    assert response.status_code == 404
    assert response.json()["code"] == "PSYCHOLOGIST_NOT_FOUND"


async def test_get_psychologist_invalid_uuid(client):
    response = await client.get(f"{LIST}/abc")

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_my_profile_success(client, psychologist, psychologist_headers):
    response = await client.get(MY_PROFILE, headers=psychologist_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["psychologist_id"] == str(psychologist.psychologist_id)
    assert body["title"] == "Клінічний психолог"
    assert body["title_eng"] == "Clinical psychologist"
    assert body["bio_eng"]["about"] == "About"
    assert sorted(body["topics"]) == ["anxiety", "stress"]
    assert body["methods"] == ["КПТ"]
    assert body["methods_eng"] == ["CBT"]
    assert body["experience_years"] == 5


async def test_my_profile_forbidden_for_client(client, client_headers):
    response = await client.get(MY_PROFILE, headers=client_headers)

    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


async def test_my_profile_unauthorized(client):
    response = await client.get(MY_PROFILE)

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_my_profile_row_missing(client, make_user, auth_headers):
    user = await make_user(role=UserRole.PSYCHOLOGIST)

    response = await client.get(MY_PROFILE, headers=auth_headers(user))

    assert response.status_code == 404
    assert response.json()["code"] == "PSYCHOLOGIST_PROFILE_NOT_FOUND"


async def test_update_title_by_script(
    client, psychologist, psychologist_headers, reload
):
    await client.patch(
        MY_PROFILE, json={"title": "Новий титул"}, headers=psychologist_headers
    )
    await reload(psychologist)
    assert psychologist.title == "Новий титул"
    assert psychologist.title_eng == "Clinical psychologist"

    await client.patch(
        MY_PROFILE, json={"title": "New title"}, headers=psychologist_headers
    )
    await reload(psychologist)
    assert psychologist.title == "Новий титул"
    assert psychologist.title_eng == "New title"


async def test_update_bio_by_script(
    client, psychologist, psychologist_headers, reload
):
    await client.patch(
        MY_PROFILE,
        json={"bio": {"about": "Нове про мене"}},
        headers=psychologist_headers,
    )
    await client.patch(
        MY_PROFILE,
        json={"bio": {"approach": "New approach"}},
        headers=psychologist_headers,
    )

    await reload(psychologist)
    assert psychologist.bio["about"] == "Нове про мене"
    assert psychologist.bio["approach"] == "Підхід"
    assert psychologist.bio_eng["approach"] == "New approach"
    assert psychologist.bio_eng["about"] == "About"


async def test_update_lists_are_split_by_script(
    client, psychologist, psychologist_headers, reload
):
    response = await client.patch(
        MY_PROFILE,
        json={
            "methods": ["Гештальт", "Gestalt"],
            "certificates": ["Диплом", "Diploma"],
        },
        headers=psychologist_headers,
    )

    assert response.status_code == 200
    await reload(psychologist)
    assert psychologist.methods == ["Гештальт"]
    assert psychologist.methods_eng == ["Gestalt"]
    assert psychologist.certificates == ["Диплом"]
    assert psychologist.certificates_eng == ["Diploma"]


async def test_update_topics_are_replaced(
    client, psychologist_headers
):
    response = await client.patch(
        MY_PROFILE, json={"topics": ["burnout"]}, headers=psychologist_headers
    )

    assert response.status_code == 200
    assert response.json()["topics"] == ["burnout"]
    cleared = await client.patch(
        MY_PROFILE, json={"topics": []}, headers=psychologist_headers
    )
    assert cleared.json()["topics"] == []


async def test_update_meet_link(
    client, psychologist, psychologist_headers, reload
):
    response = await client.patch(
        MY_PROFILE,
        json={"meet_link": "https://meet.google.com/xyz-abcd-efg"},
        headers=psychologist_headers,
    )

    assert response.status_code == 200
    await reload(psychologist)
    assert psychologist.meet_link.startswith("https://meet.google.com/xyz")
    me = await client.get("/api/users/me", headers=psychologist_headers)
    assert me.json()["meet_link"] == psychologist.meet_link


async def test_update_scalar_fields(
    client, psychologist, psychologist_headers, reload
):
    response = await client.patch(
        MY_PROFILE,
        json={"experience_years": 9, "price_per_hour": "1500.00",
              "languages": ["uk", "en"]},
        headers=psychologist_headers,
    )

    assert response.status_code == 200
    await reload(psychologist)
    assert psychologist.experience_years == 9
    assert str(psychologist.price_per_hour) == "1500.00"
    assert psychologist.languages == ["uk", "en"]


async def test_update_empty_body(client, psychologist_headers):
    response = await client.patch(MY_PROFILE, json={}, headers=psychologist_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize(
    "body",
    [
        {"title": " "},
        {"methods": ["a", " "]},
        {"languages": []},
        {"languages": ["xx"]},
        {"price_per_hour": 0},
        {"experience_years": -1},
        {"meet_link": "not a url"},
        {"meet_link": "https://meet.google.com/" + "a" * 260},
    ],
)
async def test_update_validation(
    client, psychologist, psychologist_headers, reload, body
):
    response = await client.patch(MY_PROFILE, json=body, headers=psychologist_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    await reload(psychologist)
    assert psychologist.experience_years == 5


async def test_update_forbidden_for_client(client, client_headers):
    response = await client.patch(
        MY_PROFILE, json={"title": "x"}, headers=client_headers
    )

    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


async def test_update_row_missing(client, make_user, auth_headers):
    user = await make_user(role=UserRole.PSYCHOLOGIST)

    response = await client.patch(
        MY_PROFILE, json={"title": "Титул"}, headers=auth_headers(user)
    )

    assert response.status_code == 404
    assert response.json()["code"] == "PSYCHOLOGIST_PROFILE_NOT_FOUND"


async def test_update_conflict(client, psychologist_headers):
    error = IntegrityError("stmt", {}, Exception("x"))
    with patch.object(AsyncSession, "commit", new=AsyncMock(side_effect=error)):
        response = await client.patch(
            MY_PROFILE, json={"title": "Титул"}, headers=psychologist_headers
        )

    assert response.status_code == 409
    assert response.json()["code"] == "PSYCHOLOGIST_PROFILE_UPDATE_CONFLICT"


async def test_update_db_error(client, psychologist_headers):
    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.patch(
            MY_PROFILE, json={"title": "Титул"}, headers=psychologist_headers
        )

    assert response.status_code == 500
    assert response.json()["code"] == "PSYCHOLOGIST_PROFILE_UPDATE_FAILED"


async def test_get_payout_details(client, psychologist, psychologist_headers):
    response = await client.get(PAYOUT, headers=psychologist_headers)

    assert response.status_code == 200
    assert response.json() == {
        "iban": psychologist.iban,
        "tax_id": psychologist.tax_id,
        "account_name": "Test Account",
    }


async def test_get_payout_details_forbidden(client, client_headers):
    response = await client.get(PAYOUT, headers=client_headers)

    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


async def test_get_payout_details_row_missing(client, make_user, auth_headers):
    user = await make_user(role=UserRole.PSYCHOLOGIST)

    response = await client.get(PAYOUT, headers=auth_headers(user))

    assert response.status_code == 404
    assert response.json()["code"] == "PSYCHOLOGIST_PROFILE_NOT_FOUND"


async def test_put_payout_details_normalises_iban(
    client, psychologist, psychologist_headers, make_iban, reload
):
    iban = make_iban(777)
    messy = f"{iban[:4].lower()} {iban[4:]}"

    response = await client.put(
        PAYOUT,
        json={"iban": messy, "tax_id": "12345678", "account_name": "  Іван  "},
        headers=psychologist_headers,
    )

    assert response.status_code == 200
    assert response.json()["iban"] == iban
    assert response.json()["account_name"] == "Іван"
    await reload(psychologist)
    assert psychologist.iban == iban
    assert psychologist.tax_id == "12345678"


@pytest.mark.parametrize(
    "bad_iban",
    [
        "UA12",
        "PL" + "1" * 27,
        "UA" + "A" * 27,
        "UA00" + "0" * 25,
    ],
)
async def test_put_payout_details_invalid_iban(
    client, psychologist, psychologist_headers, reload, bad_iban
):
    old_iban = psychologist.iban

    response = await client.put(
        PAYOUT,
        json={"iban": bad_iban, "tax_id": "12345678", "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"
    await reload(psychologist)
    assert psychologist.iban == old_iban


async def test_put_payout_details_wrong_checksum(
    client, psychologist_headers, make_iban
):
    iban = make_iban(5)
    wrong = iban[:-1] + ("0" if iban[-1] != "0" else "1")

    response = await client.put(
        PAYOUT,
        json={"iban": wrong, "tax_id": "12345678", "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("tax_id", ["12345678", "1234567890"])
async def test_put_payout_details_valid_tax_id(
    client, psychologist_headers, make_iban, tax_id
):
    response = await client.put(
        PAYOUT,
        json={"iban": make_iban(41), "tax_id": tax_id, "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 200


@pytest.mark.parametrize("tax_id", ["123456789", "12345abc", "١٢٣٤٥٦٧٨"])
async def test_put_payout_details_invalid_tax_id(
    client, psychologist_headers, make_iban, tax_id
):
    response = await client.put(
        PAYOUT,
        json={"iban": make_iban(41), "tax_id": tax_id, "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize("name", ["   ", "x" * 256])
async def test_put_payout_details_invalid_account_name(
    client, psychologist_headers, make_iban, name
):
    response = await client.put(
        PAYOUT,
        json={"iban": make_iban(41), "tax_id": "12345678", "account_name": name},
        headers=psychologist_headers,
    )

    assert response.status_code == 422


async def test_put_payout_details_iban_taken(
    client, make_psychologist, psychologist_headers, psychologist
):
    other = await make_psychologist()

    response = await client.put(
        PAYOUT,
        json={"iban": other.iban, "tax_id": "12345678", "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 409
    assert response.json()["code"] == "IBAN_ALREADY_EXISTS"


async def test_put_payout_details_tax_id_taken(
    client, make_psychologist, psychologist_headers, psychologist, make_iban
):
    other = await make_psychologist()

    response = await client.put(
        PAYOUT,
        json={"iban": make_iban(31), "tax_id": other.tax_id, "account_name": "A"},
        headers=psychologist_headers,
    )

    assert response.status_code == 409
    assert response.json()["code"] == "TAX_ID_ALREADY_EXISTS"


async def test_put_payout_details_same_values_ok(
    client, psychologist, psychologist_headers
):
    response = await client.put(
        PAYOUT,
        json={"iban": psychologist.iban, "tax_id": psychologist.tax_id,
              "account_name": "Test Account"},
        headers=psychologist_headers,
    )

    assert response.status_code == 200


async def test_put_payout_details_forbidden(client, client_headers, make_iban):
    response = await client.put(
        PAYOUT,
        json={"iban": make_iban(1), "tax_id": "12345678", "account_name": "A"},
        headers=client_headers,
    )

    assert response.status_code == 403
    assert response.json()["code"] == "PERMISSION_DENIED"


async def test_put_payout_details_integrity_error(
    client, psychologist_headers, make_iban
):
    error = IntegrityError("stmt", {}, Exception("x"))
    with patch.object(AsyncSession, "commit", new=AsyncMock(side_effect=error)):
        response = await client.put(
            PAYOUT,
            json={"iban": make_iban(9), "tax_id": "12345678", "account_name": "A"},
            headers=psychologist_headers,
        )

    assert response.status_code == 409
    assert response.json()["code"] == "PAYOUT_DETAILS_CONFLICT"
