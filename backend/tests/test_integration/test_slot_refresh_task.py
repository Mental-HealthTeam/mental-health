from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from tasks.celery_tasks import _refresh_psychologist_slots

KYIV = ZoneInfo("Europe/Kyiv")


async def stored_slots(db_session, psychologist):
    await db_session.refresh(psychologist)
    return [datetime.fromisoformat(s) for s in psychologist.mock_slots]


async def test_refresh_moves_past_slot_into_the_future(
    make_psychologist, db_session
):
    now = datetime.now(timezone.utc)
    old = (now - timedelta(days=7)).replace(minute=0, second=0, microsecond=0)
    psychologist = await make_psychologist(slots=[old])

    await _refresh_psychologist_slots()

    (moved,) = await stored_slots(db_session, psychologist)
    assert now < moved < now + timedelta(days=21)
    assert moved.astimezone(KYIV).weekday() == old.astimezone(KYIV).weekday()
    assert moved.astimezone(KYIV).hour == old.astimezone(KYIV).hour


async def test_refresh_keeps_future_slots(make_psychologist, db_session, slot):
    future = slot(3, 12)
    psychologist = await make_psychologist(slots=[future])

    await _refresh_psychologist_slots()

    assert await stored_slots(db_session, psychologist) == [future]


async def test_refresh_result_is_sorted_and_unique(
    make_psychologist, db_session
):
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).replace(minute=0, second=0, microsecond=0)
    two_weeks_ago = week_ago - timedelta(days=7)
    psychologist = await make_psychologist(slots=[week_ago, two_weeks_ago])

    await _refresh_psychologist_slots()

    slots = await stored_slots(db_session, psychologist)
    assert len(slots) == len(set(slots)) == 2
    assert slots == sorted(slots)
    assert all(s > now for s in slots)


async def test_refresh_invalid_slot_does_not_stop_others(
    make_psychologist, db_session
):
    broken = await make_psychologist()
    broken.mock_slots = ["not-a-date"]
    await db_session.commit()
    now = datetime.now(timezone.utc)
    good = await make_psychologist(
        slots=[(now - timedelta(days=7)).replace(minute=0, second=0, microsecond=0)]
    )

    await _refresh_psychologist_slots()

    assert (await stored_slots_raw(db_session, broken)) == ["not-a-date"]
    (moved,) = await stored_slots(db_session, good)
    assert moved > now


async def stored_slots_raw(db_session, psychologist):
    await db_session.refresh(psychologist)
    return psychologist.mock_slots


async def test_refresh_without_psychologists_is_a_noop():
    assert await _refresh_psychologist_slots() is None
