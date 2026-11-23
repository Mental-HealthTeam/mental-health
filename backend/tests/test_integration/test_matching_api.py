from datetime import datetime
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

import pytest
from redis import RedisError
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    AI_Session,
    AISessionSymptomCode,
    Gender,
    PsychologistStatus,
    SymptomCode,
)

SEARCH = "/api/matching/search"


def info(**overrides):
    body = {
        "session_id": "chat-1",
        "symptom_codes": ["anxiety"],
        "language": ["uk"],
    }
    body.update(overrides)
    return {"matching_info": body}


def result_ids(response):
    return [item["psychologist_id"] for item in response.json()["result"]]


def parse(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


async def test_matching_success_shape(client, make_psychologist):
    await make_psychologist(topics=("anxiety", "stress"))
    await make_psychologist(topics=("anxiety",))

    response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    results = response.json()["result"]
    assert len(results) == 2
    for field in (
        "psychologist_id", "full_name", "title", "avatar_url",
        "price_per_hour", "experience_years", "languages", "mock_slots",
        "matched_symptom_codes", "topics",
    ):
        assert field in results[0]


async def test_matching_returns_at_most_three(client, make_psychologist):
    for _ in range(5):
        await make_psychologist()

    response = await client.post(SEARCH, json=info())

    assert len(response.json()["result"]) == 3


async def test_matching_ranks_by_overlap(client, make_psychologist):
    both = await make_psychologist(topics=("anxiety", "stress"))
    one = await make_psychologist(topics=("anxiety", "sleep", "grief"))

    response = await client.post(
        SEARCH, json=info(symptom_codes=["anxiety", "stress"])
    )

    results = response.json()["result"]
    assert [r["psychologist_id"] for r in results] == [
        str(both.psychologist_id), str(one.psychologist_id)
    ]
    assert sorted(results[0]["matched_symptom_codes"]) == ["anxiety", "stress"]
    assert results[1]["matched_symptom_codes"] == ["anxiety"]
    assert results[1]["topics"] == sorted(["anxiety", "grief", "sleep"])


async def test_matching_info_required(client):
    empty = await client.post(SEARCH, json={})
    null = await client.post(SEARCH, json={"matching_info": None})

    for response in (empty, null):
        assert response.status_code == 400
        assert response.json()["code"] == "MATCHING_INFO_REQUIRED"


async def test_matching_empty_symptom_codes(client):
    response = await client.post(SEARCH, json=info(symptom_codes=[]))

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_matching_unknown_symptom_code(client):
    response = await client.post(SEARCH, json=info(symptom_codes=["nope"]))

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_matching_excludes_inactive(client, make_psychologist):
    active = await make_psychologist()
    await make_psychologist(status=PsychologistStatus.FROZEN)

    response = await client.post(SEARCH, json=info())

    assert result_ids(response) == [str(active.psychologist_id)]


async def test_matching_excludes_psychologists_without_free_slots(
    client, make_psychologist, slot
):
    await make_psychologist(slots=[slot(days=-1)])
    free = await make_psychologist()

    response = await client.post(SEARCH, json=info())

    assert result_ids(response) == [str(free.psychologist_id)]


async def test_matching_no_results_is_empty_list(client):
    response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    assert response.json() == {"result": []}


async def test_matching_filter_gender(client, make_psychologist):
    await make_psychologist(gender=Gender.FEMALE)
    man = await make_psychologist(gender=Gender.MALE)

    response = await client.post(SEARCH, json=info(preferred_gender="male"))

    assert result_ids(response) == [str(man.psychologist_id)]


async def test_matching_filter_experience_is_inclusive(
    client, make_psychologist
):
    junior = await make_psychologist(experience_years=2)
    middle = await make_psychologist(experience_years=5)
    senior = await make_psychologist(experience_years=10)

    exact = await client.post(
        SEARCH, json=info(min_experience_years=5, max_experience_years=5)
    )
    only_min = await client.post(SEARCH, json=info(min_experience_years=5))
    only_max = await client.post(SEARCH, json=info(max_experience_years=5))

    assert result_ids(exact) == [str(middle.psychologist_id)]
    assert set(result_ids(only_min)) == {
        str(middle.psychologist_id), str(senior.psychologist_id)
    }
    assert set(result_ids(only_max)) == {
        str(junior.psychologist_id), str(middle.psychologist_id)
    }


async def test_matching_swaps_reversed_experience_bounds(
    client, make_psychologist
):
    middle = await make_psychologist(experience_years=5)

    response = await client.post(
        SEARCH, json=info(min_experience_years=10, max_experience_years=2)
    )

    assert result_ids(response) == [str(middle.psychologist_id)]


async def test_matching_filter_price_is_inclusive(client, make_psychologist):
    await make_psychologist(price="500")
    middle = await make_psychologist(price="1000")
    await make_psychologist(price="1500")

    response = await client.post(
        SEARCH, json=info(min_price_per_hour=1000, max_price_per_hour=1000)
    )

    assert result_ids(response) == [str(middle.psychologist_id)]


async def test_matching_swaps_reversed_price_bounds(client, make_psychologist):
    middle = await make_psychologist(price="1000")

    response = await client.post(
        SEARCH, json=info(min_price_per_hour=2000, max_price_per_hour=500)
    )

    assert result_ids(response) == [str(middle.psychologist_id)]


async def test_matching_filter_language(client, make_psychologist):
    await make_psychologist(languages=("uk",))
    both = await make_psychologist(languages=("uk", "en"))

    english = await client.post(SEARCH, json=info(language=["en"]))
    anyone = await client.post(SEARCH, json=info(language=[]))

    assert result_ids(english) == [str(both.psychologist_id)]
    assert len(result_ids(anyone)) == 2


async def test_matching_time_window_both_bounds(
    client, make_psychologist, slot
):
    morning, noon, evening = slot(2, 8), slot(2, 14), slot(2, 20)
    await make_psychologist(slots=[morning, evening])
    target = await make_psychologist(slots=[morning, noon, evening])
    window = {
        "min_range_suitable_time": slot(2, 13).isoformat(),
        "max_range_suitable_time": slot(2, 15).isoformat(),
    }

    response = await client.post(SEARCH, json=info(**window))

    assert result_ids(response) == [str(target.psychologist_id)]
    slots = response.json()["result"][0]["mock_slots"]
    assert [parse(s["time"]) for s in slots] == [noon]


async def test_matching_time_window_equal_bounds_match_exact_slot(
    client, make_psychologist, slot
):
    noon = slot(2, 14)
    target = await make_psychologist(slots=[noon])

    response = await client.post(
        SEARCH,
        json=info(
            min_range_suitable_time=noon.isoformat(),
            max_range_suitable_time=noon.isoformat(),
        ),
    )

    assert result_ids(response) == [str(target.psychologist_id)]


async def test_matching_time_window_single_bound(
    client, make_psychologist, slot
):
    morning, evening = slot(2, 8), slot(2, 20)
    target = await make_psychologist(slots=[morning, evening])

    after = await client.post(
        SEARCH, json=info(min_range_suitable_time=slot(2, 12).isoformat())
    )
    before = await client.post(
        SEARCH, json=info(max_range_suitable_time=slot(2, 12).isoformat())
    )

    after_slots = after.json()["result"][0]["mock_slots"]
    before_slots = before.json()["result"][0]["mock_slots"]
    assert [parse(s["time"]) for s in after_slots] == [evening]
    assert [parse(s["time"]) for s in before_slots] == [morning]
    assert result_ids(after) == [str(target.psychologist_id)]


async def test_matching_naive_time_is_kyiv(client, make_psychologist, slot):
    noon = slot(2, 12)
    target = await make_psychologist(slots=[noon])
    naive_kyiv = (
        noon.astimezone(ZoneInfo("Europe/Kyiv")).replace(tzinfo=None).isoformat()
    )

    response = await client.post(
        SEARCH,
        json=info(
            min_range_suitable_time=naive_kyiv,
            max_range_suitable_time=naive_kyiv,
        ),
    )

    assert result_ids(response) == [str(target.psychologist_id)]


async def test_matching_swaps_reversed_time_bounds(
    client, make_psychologist, slot
):
    noon = slot(2, 14)
    target = await make_psychologist(slots=[noon])

    response = await client.post(
        SEARCH,
        json=info(
            min_range_suitable_time=slot(2, 15).isoformat(),
            max_range_suitable_time=slot(2, 13).isoformat(),
        ),
    )

    assert result_ids(response) == [str(target.psychologist_id)]


async def test_matching_hides_taken_slots(
    client, make_psychologist, make_booking, other_client, slot
):
    taken, free = slot(2, 10), slot(3, 10)
    psychologist = await make_psychologist(slots=[taken, free])
    await make_booking(other_client, psychologist, selected_time=taken)

    response = await client.post(SEARCH, json=info())

    slots = response.json()["result"][0]["mock_slots"]
    assert [parse(s["time"]) for s in slots] == [free]


async def test_matching_cancelled_booking_does_not_block_slot(
    client, make_psychologist, make_booking, other_client, slot
):
    from database.models.models import BookingStatus, PaymentStatus

    only = slot(2, 10)
    psychologist = await make_psychologist(slots=[only])
    await make_booking(
        other_client, psychologist, selected_time=only,
        status=BookingStatus.CANCELLED, payment_status=PaymentStatus.UNPAID,
    )

    response = await client.post(SEARCH, json=info())

    assert result_ids(response) == [str(psychologist.psychologist_id)]


async def test_matching_psychologist_with_only_taken_slot_is_excluded(
    client, make_psychologist, make_booking, other_client, slot
):
    only = slot(2, 10)
    psychologist = await make_psychologist(slots=[only])
    await make_booking(other_client, psychologist, selected_time=only)

    response = await client.post(SEARCH, json=info())

    assert response.json() == {"result": []}


async def test_matching_lang_en_with_fallback(client, make_psychologist):
    await make_psychologist(
        full_name="Українське", full_name_eng="English", title="Титул",
        title_eng=None,
    )

    response = await client.post(SEARCH + "?lang=en", json=info())

    result = response.json()["result"][0]
    assert result["full_name"] == "English"
    assert result["title"] == "Титул"


async def test_matching_database_error(client):
    with patch.object(
        AsyncSession, "execute", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(SEARCH, json=info())

    assert response.status_code == 500
    assert response.json()["code"] == "MATCHING_DATABASE_ERROR"


async def test_matching_logs_ai_session(
    client, make_psychologist, fake_redis, client_user, client_headers, fetch
):
    await make_psychologist()
    fake_redis.add_session("chat-1", message_count=6)

    response = await client.post(
        SEARCH, json=info(symptom_codes=["anxiety", "stress"]),
        headers=client_headers,
    )

    assert response.status_code == 200
    records = await fetch(select(AI_Session))
    assert len(records) == 1
    record = records[0]
    assert record.ai_session_id == "chat-1"
    assert record.user_id == client_user.id
    assert record.messages_count == 6
    assert record.recommendations_count == 1
    assert record.duration_sec >= 60
    codes = await fetch(select(AISessionSymptomCode))
    assert {c.symptom_code for c in codes} == {
        SymptomCode.ANXIETY, SymptomCode.STRESS
    }


async def test_matching_updates_existing_ai_session(
    client, make_psychologist, fake_redis, fetch
):
    await make_psychologist(topics=("anxiety", "stress", "sleep"))
    fake_redis.add_session("chat-1", message_count=2)
    await client.post(SEARCH, json=info(symptom_codes=["anxiety", "stress"]))
    fake_redis.add_session("chat-1", message_count=9)

    await client.post(SEARCH, json=info(symptom_codes=["anxiety", "sleep"]))

    records = await fetch(select(AI_Session))
    assert len(records) == 1
    assert records[0].messages_count == 9
    codes = await fetch(select(AISessionSymptomCode))
    assert {c.symptom_code for c in codes} == {
        SymptomCode.ANXIETY, SymptomCode.SLEEP
    }


async def test_matching_anonymous_user_is_logged_without_user_id(
    client, make_psychologist, fake_redis, fetch
):
    await make_psychologist()
    fake_redis.add_session("chat-1")

    response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    assert (await fetch(select(AI_Session)))[0].user_id is None


async def test_matching_fills_user_id_on_later_request(
    client, make_psychologist, fake_redis, client_headers, client_user, fetch
):
    await make_psychologist()
    fake_redis.add_session("chat-1")
    await client.post(SEARCH, json=info())

    await client.post(SEARCH, json=info(), headers=client_headers)

    assert (await fetch(select(AI_Session)))[0].user_id == client_user.id


async def test_matching_invalid_token_is_anonymous(client, make_psychologist):
    await make_psychologist()

    response = await client.post(
        SEARCH, json=info(), headers={"Cookie": "access=garbage"}
    )

    assert response.status_code == 200
    assert len(response.json()["result"]) == 1


async def test_matching_redis_session_missing(
    client, make_psychologist, fetch
):
    await make_psychologist()

    response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    assert len(response.json()["result"]) == 1
    assert await fetch(select(AI_Session)) == []


async def test_matching_redis_error(
    client, make_psychologist, fake_redis, fetch
):
    await make_psychologist()
    fake_redis.error = RedisError("down")

    response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    assert len(response.json()["result"]) == 1
    assert await fetch(select(AI_Session)) == []


async def test_matching_log_save_failure_keeps_results(
    client, make_psychologist, fake_redis
):
    await make_psychologist()
    fake_redis.add_session("chat-1")

    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(SEARCH, json=info())

    assert response.status_code == 200
    assert len(response.json()["result"]) == 1
