from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import Booking, BookingStatus


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
