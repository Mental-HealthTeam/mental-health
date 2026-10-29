from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.models import (
    Booking,
    BookingStatus,
    PaymentStatus,
)


SESSION_STATUSES = {
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.DISPUTED,
}

PAID_STATUSES = {
    PaymentStatus.HELD,
    PaymentStatus.PAID,
}


def set_meet_link(booking: Booking) -> None:
    """Expose the meeting link only for eligible, paid sessions."""
    eligible_status = booking.status in SESSION_STATUSES
    paid_status = booking.payment_status in PAID_STATUSES

    if eligible_status and paid_status:
        booking.meet_link = booking.psychologist.meet_link
    else:
        booking.meet_link = None


async def get_sessions_for_user(
    db: AsyncSession,
    user_id: UUID,
) -> list[Booking]:
    """Return sessions belonging to the authenticated client."""
    statement = (
        select(Booking)
        .where(
            Booking.client_id == user_id,
            Booking.status.in_(SESSION_STATUSES),
        )
        .options(selectinload(Booking.psychologist))
        .order_by(Booking.selected_time.asc())
    )

    result = await db.execute(statement)
    bookings = list(result.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings


async def get_sessions_for_psychologist(
    db: AsyncSession,
    psychologist_id: UUID,
) -> list[Booking]:
    """Return sessions belonging to the authenticated psychologist."""
    statement = (
        select(Booking)
        .where(
            Booking.psychologist_id == psychologist_id,
            Booking.status.in_(SESSION_STATUSES),
        )
        .options(
            selectinload(Booking.psychologist),
            selectinload(Booking.client),
        )
        .order_by(Booking.selected_time.asc())
    )

    result = await db.execute(statement)
    bookings = list(result.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings
