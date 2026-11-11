import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config.settings import Settings
from database.models.models import (
    AI_Session,
    Booking,
    BookingStatus,
    PaymentStatus,
    Psychologist,
    PsychologistStatus,
    User,
    UserRole
)
from payment_provider.payment_types import PaymentProviderName, RefundRequest
from schemas.booking import BookingCreateRequest
from services.session_service import set_meet_link
from payment_provider.payment_interface import PaymentProviderInterface
from exceptions.payments import PaymentProviderError
from services.slot_service import get_nearest_available_slot
from exceptions.base import AppError

logger = logging.getLogger(__name__)


async def create_booking(
        db: AsyncSession,
        settings: Settings,
        client: User,
        data: BookingCreateRequest,
) -> Booking:
    """Create a PENDING / UNPAID booking and hold the slot for BOOKING_HOLD_MINUTES.

    Checks the psychologist, time, slot and AI session (422); the price comes
    from the psychologist profile. Raises 422, 409 if the slot is taken.
    Route: POST /api/bookings
    """
    now = datetime.now(timezone.utc)
    selected_time = data.selected_time.astimezone(timezone.utc)

    if selected_time <= now:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "BOOKING_TIME_IN_PAST",
            "Selected time must be in the future.",
        )

    if selected_time > now + timedelta(
        days=settings.BOOKING_HORIZON_DAYS
    ):
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "BOOKING_TIME_TOO_FAR",
            "Selected time exceeds the booking horizon.",
        )

    result = await db.execute(
        select(Psychologist).where(
            Psychologist.psychologist_id == data.psychologist_id,
            Psychologist.profile_status == PsychologistStatus.ACTIVE,
        )
    )
    psychologist = result.scalar_one_or_none()

    if psychologist is None:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "PSYCHOLOGIST_NOT_AVAILABLE",
            "Psychologist not found or not active.",
        )

    selected_slot = None

    for slot in psychologist.mock_slots or []:
        try:
            slot_time = datetime.fromisoformat(slot)
        except (KeyError, TypeError, ValueError):
            continue

        if slot_time.tzinfo is None or slot_time.utcoffset() is None:
            continue

        if slot_time.astimezone(timezone.utc) == selected_time:
            selected_slot = slot
            break

    if selected_slot is None:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "SLOT_NOT_AVAILABLE",
            "Selected time is not an available slot.",
        )

    if data.ai_session_id is not None:
        result = await db.execute(
            select(AI_Session).where(
                AI_Session.ai_session_id == data.ai_session_id,
                AI_Session.user_id == client.id,
            )
        )
        if result.scalar_one_or_none() is None:
            raise AppError(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "AI_SESSION_NOT_FOUND",
                "AI session not found for this user.",
            )

    booking = Booking(
        client_id=client.id,
        psychologist_id=psychologist.psychologist_id,
        selected_time=selected_time,
        status=BookingStatus.PENDING,
        payment_status=PaymentStatus.UNPAID,
        price=psychologist.price_per_hour,
        currency="UAH",
        ai_session_id=data.ai_session_id,
        hold_expires_at=now + timedelta(
            minutes=settings.BOOKING_HOLD_MINUTES
        ),
    )

    db.add(booking)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        nearest_available_slot = await get_nearest_available_slot(
            db=db,
            psychologist_id=data.psychologist_id,
            selected_time=selected_time
        )
        raise AppError(
            status.HTTP_409_CONFLICT,
            "SLOT_ALREADY_BOOKED",
            "The time slot is already taken.",
            nearest_available_slot=nearest_available_slot,
        ) from exc

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking.id)
    )
    return result.scalar_one()


async def get_booking_for_user(
    db: AsyncSession,
    booking_id: UUID,
    user: User,
) -> Booking:
    """Return a booking to its client, its psychologist or an admin."""
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    is_admin = user.role == UserRole.ADMIN
    is_client = booking.client_id == user.id
    is_psychologist = booking.psychologist_id == user.id

    if not (is_admin or is_client or is_psychologist):
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    set_meet_link(booking)

    return booking


async def list_bookings_for_user(
    db: AsyncSession,
    user: User,
    booking_status: BookingStatus | None,
    limit: int,
    offset: int,
) -> tuple[list[Booking], int]:
    """Return the user's bookings and total count."""
    filters = []

    if user.role == UserRole.CLIENT:
        filters.append(Booking.client_id == user.id)
    elif user.role == UserRole.PSYCHOLOGIST:
        filters.append(Booking.psychologist_id == user.id)
    elif user.role != UserRole.ADMIN:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "BOOKINGS_VIEW_FORBIDDEN",
            "You do not have permission to view bookings.",
        )

    if booking_status is not None:
        filters.append(Booking.status == booking_status)

    count_result = await db.execute(
        select(func.count())
        .select_from(Booking)
        .where(*filters)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(*filters)
        .order_by(Booking.selected_time.desc())
        .limit(limit)
        .offset(offset)
    )
    bookings = list(result.scalars().all())

    for booking in bookings:
        set_meet_link(booking)

    return bookings, total


# Called by payments and admin actions

async def find_booking_by_payment(
        db: AsyncSession,
        provider: PaymentProviderName,
        provider_session_id: str | None,
        payment_reference: str | None,
) -> Booking | None:
    """Find by provider_session_id, then payment_reference; None if not found.

    Route: POST /api/payments/webhook/{provider}
    """

    if provider_session_id:
        result = await db.execute(
            select(Booking).where(
                Booking.payment_provider == provider,
                Booking.provider_session_id == provider_session_id,
            )
        )
        booking = result.scalar_one_or_none()

        if booking is not None:
            return booking

    if payment_reference:
        result = await db.execute(
            select(Booking).where(
                Booking.payment_provider == provider,
                Booking.payment_reference == payment_reference,
            )
        )
        return result.scalar_one_or_none()

    return None


async def mark_paid(
    db: AsyncSession,
    booking_id: UUID,
    provider: PaymentProviderName,
    provider_session_id: str,
    payment_reference: str | None,
    paid_at: datetime,
) -> Booking:
    """PENDING / UNPAID -> CONFIRMED / HELD. Idempotent. Raises 404, 409.

    Route: POST /api/payments/webhook/{provider} ("paid" event).
    """
    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    # Idempotency: repeated successful payment event.
    if (
        booking.status == BookingStatus.CONFIRMED
        and booking.payment_status == PaymentStatus.HELD
        and booking.payment_provider == provider
        and booking.provider_session_id == provider_session_id
    ):
        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.psychologist))
            .where(Booking.id == booking_id)
        )
        return result.scalar_one()

    if (
        booking.status != BookingStatus.PENDING
        or booking.payment_status != PaymentStatus.UNPAID
    ):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_WRONG_STATE",
            "Booking cannot be marked as paid in its current state.",
        )

    # Reject payment confirmation after the hold has expired.
    now = datetime.now(timezone.utc)
    if (
        booking.hold_expires_at is not None
        and booking.hold_expires_at <= now
    ):
        booking.status = BookingStatus.CANCELLED
        booking.payment_status = PaymentStatus.UNPAID
        await db.commit()

        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_HOLD_EXPIRED",
            "Booking hold has expired.",
        )

    booking.status = BookingStatus.CONFIRMED
    booking.payment_status = PaymentStatus.HELD
    booking.payment_provider = provider
    booking.provider_session_id = provider_session_id
    booking.payment_reference = payment_reference
    booking.paid_at = paid_at

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


async def mark_payment_failed(
        db: AsyncSession,
        booking_id: UUID,
) -> Booking:
    """PENDING -> CANCELLED, slot freed. Idempotent. Raises 404, 409.

    Route: POST /api/payments/webhook/{provider} ("failed" and "expired" events)
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    # Repeated failure event: already cancelled and unpaid.
    if (
        booking.status == BookingStatus.CANCELLED
        and booking.payment_status == PaymentStatus.UNPAID
    ):
        return booking

    if (
        booking.status != BookingStatus.PENDING
        or booking.payment_status != PaymentStatus.UNPAID
    ):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_WRONG_STATE",
            "Booking cannot be cancelled due to payment failure in its current state.",
        )

    booking.status = BookingStatus.CANCELLED

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


async def mark_cancelled(
        db: AsyncSession,
        booking_id: UUID,
        refunded: bool,
) -> Booking:
    """PENDING / CONFIRMED -> CANCELLED, slot freed.

    payment_status becomes REFUNDED when refunded is True. Idempotent.
    Raises 404, 409.
    Route: POST /api/bookings/{booking_id}/cancel
    (also POST /api/payments/webhook/{provider} on a "refunded" event)
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    # Repeated cancellation is idempotent.
    if booking.status == BookingStatus.CANCELLED:
        if refunded and booking.payment_status != PaymentStatus.REFUNDED:
            booking.payment_status = PaymentStatus.REFUNDED
            await db.commit()

        result = await db.execute(
            select(Booking)
            .options(selectinload(Booking.psychologist))
            .where(Booking.id == booking_id)
        )
        return result.scalar_one()

    if booking.status not in {
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
    }:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_CANNOT_BE_CANCELLED",
            "Booking cannot be cancelled in its current state.",
        )

    booking.status = BookingStatus.CANCELLED

    if refunded:
        booking.payment_status = PaymentStatus.REFUNDED

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


async def mark_disputed(
        db: AsyncSession,
        booking_id: UUID,
        admin: User,
        note: str,
) -> Booking:
    """CONFIRMED / COMPLETED (HELD) -> DISPUTED; payout skips it.

    Stores the note and the admin who opened the dispute. Raises 404, 409.
    Route: POST /api/bookings/{booking_id}/dispute
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    if (
        booking.status not in {
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
        }
        or booking.payment_status != PaymentStatus.HELD
    ):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_WRONG_STATE",
            "Booking cannot be disputed in its current state.",
        )

    booking.status = BookingStatus.DISPUTED
    booking.disputed_by_id = admin.id
    booking.dispute_note = note
    booking.dispute_resolved_by_id = None
    logger.info(
        "Booking disputed: booking_id=%s admin_id=%s",
        booking_id,
        admin.id,
    )

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


async def mark_dispute_refunded(
        db: AsyncSession,
        booking_id: UUID
) -> Booking:
    """DISPUTED -> CANCELLED / REFUNDED after the provider confirmed the refund.

    Clears refund_error. Idempotent. Raises 404, 409.
    Route: POST /api/payments/webhook/{provider} ("refunded" event).
    """
    result = await db.execute(
        select(Booking)
        .execution_options(populate_existing=True)
        .where(Booking.id == booking_id)
        .with_for_update()
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    if (
            booking.status == BookingStatus.CANCELLED
            and booking.payment_status == PaymentStatus.REFUNDED
    ):
        return booking

    if booking.status != BookingStatus.DISPUTED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_NOT_DISPUTED",
            "Booking is not in a disputed state.",
        )

    booking.status = BookingStatus.CANCELLED
    booking.payment_status = PaymentStatus.REFUNDED
    booking.refund_error = False

    await db.commit()

    return booking


async def resolve_dispute(
        db: AsyncSession,
        payment_provider: PaymentProviderInterface,
        booking_id: UUID,
        new_status: BookingStatus,
        admin: User,
) -> Booking:
    """DISPUTED -> COMPLETED or CANCELLED (payment REFUNDED). Raises 404, 409, 422.

    Route: POST /api/bookings/{booking_id}/resolve-dispute
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    if booking.status != BookingStatus.DISPUTED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_NOT_DISPUTED",
            "Booking is not in a disputed state.",
        )

    if new_status not in {
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
    }:
        raise AppError(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "DISPUTE_INVALID_RESOLUTION",
            "A dispute can only be resolved as completed or cancelled.",
        )
    if new_status == BookingStatus.CANCELLED:
        try:
            if not booking.payment_reference:
                logger.error(
                    "Booking %s is paid but has no payment reference, refund is not possible",
                    booking_id
                )
                raise AppError(
                    status.HTTP_409_CONFLICT,
                    "REFUND_NOT_AUTOMATIC",
                    "The payment for this booking cannot be refunded automatically, contact support.",
                )
            if booking.payment_status != PaymentStatus.HELD:
                logger.error(
                    "Dispute on booking %s cannot be refunded: payment status is %s, expected held",
                    booking_id, booking.payment_status.value
                )
                raise AppError(
                    status.HTTP_409_CONFLICT,
                    "REFUND_NOT_AUTOMATIC",
                    "The payment for this booking is no longer held by the platform "
                    "and cannot be refunded automatically, contact support.",
                )
            booking.status = new_status
            await db.commit()
            refund_request = RefundRequest(
                payment_reference=booking.payment_reference,
                amount=booking.price,
                reason="Dispute resolved in favour of the client"
            )
            await payment_provider.refund(refund_request)
            booking.payment_status = PaymentStatus.REFUNDED
            booking.refund_error = False
            logger.info(
                "Booking %s cancelled and refunded (amount %s)",
                booking_id, booking.price
            )
        except PaymentProviderError as e:
            logger.error(
                "Refund failed for booking %s, manual check needed: %s",
                booking_id, e
            )
            await mark_refund_failed(
                db=db,
                booking_id=booking.id,
                resolve_dispute_error=True
            )
            raise AppError(
                status.HTTP_502_BAD_GATEWAY,
                "REFUND_FAILED",
                "The refund failed, contact the payment provider.",
            ) from e
    else:
        booking.status = new_status

    booking.dispute_resolved_by_id = admin.id

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one()

    set_meet_link(booking)

    return booking


async def mark_paid_out(
        db: AsyncSession,
        booking_id: UUID,
        payout_amount: Decimal,
        platform_fee: Decimal,
        released_at: datetime,
) -> Booking:
    """COMPLETED / HELD -> PAID and store the payout data.

    Idempotent: a booking that is already PAID is returned unchanged.
    payout_reference is set by the payout task before the payout. Raises 404, 409.
    Route: none, called by the automatic payout task.
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    # Idempotency: the same payout must not be applied twice.
    if (
            booking.status == BookingStatus.COMPLETED
            and booking.payment_status == PaymentStatus.PAID
    ):
        return booking

    if (
            booking.status != BookingStatus.COMPLETED
            or booking.payment_status != PaymentStatus.HELD
    ):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_NOT_READY_FOR_PAYOUT",
            "Booking is not ready for payout.",
        )

    booking.payment_status = PaymentStatus.PAID
    booking.payout_amount = payout_amount
    booking.platform_fee = platform_fee
    booking.released_at = released_at

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


# Called by Celery tasks (no HTTP context)

async def expire_pending_bookings(
        db: AsyncSession,
        now: datetime,
) -> int:
    """Cancel PENDING bookings with hold_expires_at before now; return the count.

    Route: none, called by the task that releases expired holds.
    """

    result = await db.execute(
        select(Booking)
        .where(
            Booking.status == BookingStatus.PENDING,
            Booking.hold_expires_at.is_not(None),
            Booking.hold_expires_at <= now,
        )
        .with_for_update(skip_locked=True)
    )
    bookings = result.scalars().all()

    for booking in bookings:
        booking.status = BookingStatus.CANCELLED
        booking.payment_status = PaymentStatus.UNPAID

    await db.commit()

    return len(bookings)


async def complete_session_with_psychologist(
        db: AsyncSession,
        now: datetime,
        session_time_min: int
) -> int:
    """CONFIRMED / HELD -> COMPLETED for sessions that are over; return the count.

    Over means selected_time + session_time_min <= now. Rows are locked with
    FOR UPDATE SKIP LOCKED.
    Route: none, called by the session completion task.
    """

    stmt = select(Booking).where(
        Booking.status == BookingStatus.CONFIRMED,
        Booking.payment_status == PaymentStatus.HELD,
        Booking.selected_time + timedelta(minutes=session_time_min) <= now
    ).with_for_update(skip_locked=True)

    result = await db.execute(stmt)
    bookings = result.scalars().all()
    for booking in bookings:
        booking.completed_at = now
        booking.status = BookingStatus.COMPLETED
    await db.commit()
    return len(bookings)


async def list_ids_ready_for_payout(
        db: AsyncSession,
) -> list[UUID]:
    """Return ids of psychologists with COMPLETED / HELD bookings not yet paid out.

    Not paid out means payout_reference is empty. Each id is returned once,
    sorted. Rows are not locked: the payout task locks each psychologist's
    bookings separately.
    Route: none, called by the monthly payout task.
    """

    stmt = select(Booking.psychologist_id).where(
        Booking.status == BookingStatus.COMPLETED,
        Booking.payment_status == PaymentStatus.HELD,
        Booking.payout_reference.is_(None)
    ).order_by(Booking.psychologist_id).distinct()

    result = await db.execute(stmt)
    psychologist_ids = result.scalars().all()

    return psychologist_ids


async def list_ready_for_payout(
        db: AsyncSession,
        psychologist_id: UUID
) -> list[Booking]:
    """Return COMPLETED / HELD bookings of one psychologist not yet paid out.

    Not paid out means payout_reference is empty. Rows are locked with
    FOR UPDATE SKIP LOCKED until the caller commits, oldest first; the
    psychologist is loaded. Does not change or commit anything.
    Route: none, called by the monthly payout task.
    """

    result = await db.execute(
        select(Booking)
        .where(
            Booking.status == BookingStatus.COMPLETED,
            Booking.payment_status == PaymentStatus.HELD,
            Booking.payout_reference.is_(None),
            Booking.psychologist_id == psychologist_id
        )
        .options(
            selectinload(Booking.psychologist)
        )
        .order_by(Booking.selected_time.asc())
        .with_for_update(skip_locked=True)
    )

    return list(result.scalars().all())


async def mark_completed(
        db: AsyncSession,
        booking_id: UUID,
        completed_at: datetime,
) -> Booking:
    """CONFIRMED -> COMPLETED and store completed_at. Idempotent.

    Route: none, called by the automatic payout task.
    """

    result = await db.execute(
        select(Booking)
        .where(Booking.id == booking_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    booking = result.scalar_one_or_none()

    if booking is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )

    # Idempotency: do not change the original completion timestamp.
    if booking.status == BookingStatus.COMPLETED:
        return booking

    if (
        booking.status != BookingStatus.CONFIRMED
        or booking.payment_status != PaymentStatus.HELD
    ):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_WRONG_STATE",
            "Booking cannot be completed in its current state.",
        )

    booking.status = BookingStatus.COMPLETED
    booking.completed_at = completed_at

    await db.commit()

    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.psychologist))
        .where(Booking.id == booking_id)
    )
    return result.scalar_one()


async def mark_refund_failed(
        db: AsyncSession,
        booking_id: UUID,
        resolve_dispute_error: bool = False
) -> Booking:
    """CANCELLED / HELD -> DISPUTED with refund_error after a failed refund.

    payment_status stays HELD: the money was not returned. If the slot was
    taken again, the booking stays CANCELLED with refund_error. Idempotent.
    Raises 404, 409.
    Route: none, called by the booking cancellation service.
    """
    booking = (await db.execute(
        select(Booking).where(
            Booking.id == booking_id
        ).with_for_update()
        .execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if not booking:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "BOOKING_NOT_FOUND",
            "Booking not found.",
        )
    # Idempotency: the refund error is already recorded (DISPUTED or CANCELLED).
    if booking.refund_error:
        return booking

    if (
            booking.status == BookingStatus.CANCELLED
            and booking.payment_status == PaymentStatus.HELD
    ):
        try:
            booking.status = BookingStatus.DISPUTED
            booking.dispute_resolved_by_id = None
            if (
                    resolve_dispute_error and
                    booking.dispute_note is not None and
                    booking.dispute_note.strip() != ""
            ):
                booking.dispute_note = "Resolve dispute failed: " + booking.dispute_note
            else:
                booking.dispute_note = "Refund failed"
            booking.refund_error = True
            await db.commit()
        except IntegrityError:
            await db.rollback()
            logger.error(
                "Refund failed for booking %s and its slot is already taken: "
                "booking kept CANCELLED with refund_error, manual check needed",
                booking_id
            )
            booking = (await db.execute(
                select(Booking).where(
                    Booking.id == booking_id
                ).with_for_update()
            )).scalar_one_or_none()
            booking.refund_error = True
            await db.commit()
        except SQLAlchemyError as e:
            logger.exception(
                "Could not save the refund error for booking %s",
                booking_id
            )
            await db.rollback()
            raise AppError(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "REFUND_ERROR_SAVE_FAILED",
                "Could not save the refund error.",
            ) from e
    else:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "BOOKING_WRONG_STATE",
            "Booking cannot be marked as refund failed in its current state.",
        )
    return booking
