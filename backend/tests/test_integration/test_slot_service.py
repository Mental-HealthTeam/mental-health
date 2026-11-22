import pytest

from database.models.models import BookingStatus, PaymentStatus
from services.slot_service import (
    get_nearest_available_slot,
    get_unavailable_slots,
)


@pytest.mark.parametrize(
    "status,blocks",
    [
        (BookingStatus.PENDING, True),
        (BookingStatus.CONFIRMED, True),
        (BookingStatus.DISPUTED, True),
        (BookingStatus.COMPLETED, True),
        (BookingStatus.CANCELLED, False),
    ],
)
async def test_unavailable_slots_by_status(
    db_session, client_user, psychologist, make_booking, slot, status, blocks
):
    when = slot(2, 10)
    await make_booking(
        client_user, psychologist, selected_time=when, status=status,
        payment_status=PaymentStatus.UNPAID,
    )

    taken = await get_unavailable_slots(db_session, [psychologist.psychologist_id])

    assert ((psychologist.psychologist_id, when) in taken) is blocks


async def test_unavailable_slots_ignore_past_bookings(
    db_session, client_user, psychologist, make_booking, slot
):
    await make_booking(
        client_user, psychologist, selected_time=slot(-2, 10),
        status=BookingStatus.COMPLETED,
    )

    taken = await get_unavailable_slots(db_session, [psychologist.psychologist_id])

    assert taken == set()


async def test_unavailable_slots_without_ids(db_session):
    assert await get_unavailable_slots(db_session, []) == set()


async def test_nearest_available_slot_is_the_closest_free_one(
    db_session, client_user, make_psychologist, make_booking, slot
):
    psychologist = await make_psychologist(
        slots=[slot(2, 10), slot(2, 15), slot(5, 10)]
    )
    await make_booking(client_user, psychologist, selected_time=slot(2, 15))

    nearest = await get_nearest_available_slot(
        db_session, psychologist.psychologist_id, slot(2, 14)
    )

    assert nearest == slot(2, 10).isoformat()


async def test_nearest_available_slot_none_when_everything_is_taken(
    db_session, client_user, make_psychologist, make_booking, slot
):
    only = slot(2, 10)
    psychologist = await make_psychologist(slots=[only])
    await make_booking(client_user, psychologist, selected_time=only)

    nearest = await get_nearest_available_slot(
        db_session, psychologist.psychologist_id, only
    )

    assert nearest is None
