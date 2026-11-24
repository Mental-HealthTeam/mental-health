from datetime import timezone, datetime, timedelta
from uuid import UUID

from fastapi import status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config.settings import BaseAppSettings
from database.models.models import (
    Booking,
    BookingStatus,
    PaymentStatus,
    Psychologist,
    User,
)
from exceptions.base import AppError
from schemas.session import SessionSavedResponse

COMPLETED_SESSION_OFFSET = 10**10


SESSION_STATUSES = {
    BookingStatus.CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.DISPUTED,
}

PAID_STATUSES = {
    PaymentStatus.HELD,
    PaymentStatus.PAID,
}


def sort_all_sessions(
        now: datetime,
        session: Booking,
        session_duration: int
) -> int | float:
    result_score = abs(now - session.selected_time).total_seconds()
    time_ended_session = (
        session.selected_time.astimezone(timezone.utc)
        + timedelta(minutes=session_duration)
    )
    if time_ended_session >= now:
        result_score -= COMPLETED_SESSION_OFFSET
    return result_score


def sort_scheduled_sessions(now: datetime, session: Booking):
    return (session.selected_time - now).total_seconds()


def sort_completed_sessions(now: datetime, session: Booking):
    return (now - session.selected_time).total_seconds()


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
        .options(
            selectinload(Booking.psychologist).selectinload(
                Psychologist.psychologist_specializations
            )
        )
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
            selectinload(Booking.psychologist).selectinload(
                Psychologist.psychologist_specializations
            ),
            selectinload(Booking.client)
            .selectinload(User.user_symptom_codes)
        )
        .order_by(Booking.selected_time.asc())
    )

    result = await db.execute(statement)
    bookings = list(result.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings


async def get_scheduled_sessions_for_user(
    db: AsyncSession,
    current_user: User,
    now: datetime,
    settings: BaseAppSettings
) -> list[Booking]:
    now = now - timedelta(minutes=settings.SESSION_DURATION_MIN)
    stmt = select(Booking).where(
        Booking.selected_time >= now,
        Booking.client_id == current_user.id,
        Booking.status.in_(SESSION_STATUSES)
    ).options(
        selectinload(Booking.psychologist).selectinload(
            Psychologist.psychologist_specializations
        )
    )
    response = await db.execute(stmt)
    bookings = list(response.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings


async def get_completed_sessions_for_user(
    db: AsyncSession,
    current_user: User,
    now: datetime,
    settings: BaseAppSettings
) -> list[Booking]:
    now = now - timedelta(minutes=settings.SESSION_DURATION_MIN)
    stmt = select(Booking).where(
        Booking.selected_time < now,
        Booking.client_id == current_user.id,
        Booking.status.in_(SESSION_STATUSES)
    ).options(
        selectinload(Booking.psychologist).selectinload(
            Psychologist.psychologist_specializations
        )
    )
    response = await db.execute(stmt)
    bookings = list(response.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings


async def get_saved_sessions_for_user(
    db: AsyncSession,
    current_user: User,
) -> list[Booking]:
    stmt = select(Booking).where(
        Booking.saved.is_(True),
        Booking.client_id == current_user.id,
        Booking.status.in_(SESSION_STATUSES)
    ).options(
        selectinload(Booking.psychologist).selectinload(
            Psychologist.psychologist_specializations
        )
    )
    response = await db.execute(stmt)
    bookings = list(response.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings


async def set_session_saved(
    booking_id: UUID,
    is_saved: bool,
    db: AsyncSession,
    current_user: User,
) -> SessionSavedResponse:
    booking = await db.get(Booking, booking_id)

    if (
        booking is None
        or booking.client_id != current_user.id
        or booking.status not in SESSION_STATUSES
    ):
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )
    booking.saved = is_saved

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT,
            "SESSION_SAVE_CONFLICT",
            "Session could not be saved due to a conflict.",
        ) from e
    except SQLAlchemyError as e:
        await db.rollback()
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "SESSION_SAVE_FAILED",
            "Failed to save the session.",
        ) from e
    return SessionSavedResponse(
        booking_id=booking.id,
        saved=booking.saved
    )
