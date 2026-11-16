from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import Booking, BookingStatus, Psychologist


async def get_unavailable_slots(
        db: AsyncSession,
        psychologist_ids: list[UUID]
) -> set[tuple[UUID, datetime]]:
    if not psychologist_ids:
        return set()
    now = datetime.now(timezone.utc)
    stmt = select(Booking.psychologist_id, Booking.selected_time).where(
        Booking.psychologist_id.in_(psychologist_ids),
        Booking.status.in_(
            [
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.DISPUTED,
                BookingStatus.COMPLETED,
            ]
        ),
        Booking.selected_time > now
    )
    result = await db.execute(stmt)
    rows_taken = result.all()

    taken_slots = {
        (psychologist_id, selected_time)
        for psychologist_id, selected_time in rows_taken
    }

    return taken_slots


def free_slots(
    mock_slots: list[str] | None,
    taken_slots: set[tuple[UUID, datetime]],
    psychologist_id: UUID
) -> list[str]:
    available_mock_slots = []
    now = datetime.now(timezone.utc)
    for mock_slot in mock_slots or []:
        slot_time = datetime.fromisoformat(mock_slot).astimezone(timezone.utc)
        is_free = slot_time > now and (psychologist_id, slot_time) not in taken_slots
        if is_free:
            available_mock_slots.append(mock_slot)
    return available_mock_slots


def slots_in_window(slots, min_time, max_time):
    return [
        slot for slot in slots
        if (min_time is None or datetime.fromisoformat(slot) >= min_time)
        and (max_time is None or datetime.fromisoformat(slot) <= max_time)
    ]


async def get_nearest_available_slot(
    db: AsyncSession,
    psychologist_id: UUID,
    selected_time: datetime
):
    psychologist = await db.get(Psychologist, psychologist_id)
    taken_slots = await get_unavailable_slots(
        db=db,
        psychologist_ids=[psychologist.psychologist_id],

    )
    free_slots_array = free_slots(
        mock_slots=psychologist.mock_slots,
        taken_slots=taken_slots,
        psychologist_id=psychologist.psychologist_id,
    )

    nearest_available_slot = min(
        free_slots_array,
        key=lambda s: abs(datetime.fromisoformat(s).astimezone(timezone.utc) - selected_time),
        default=None
    )

    return nearest_available_slot
