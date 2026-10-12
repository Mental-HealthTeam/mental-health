from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import Settings
from database.models.models import Booking, BookingStatus, User
from payment_provider.payment_types import PaymentProviderName
from schemas.booking import BookingCreateRequest


async def create_booking(
        db: AsyncSession,
        settings: Settings,
        client: User,
        data: BookingCreateRequest,
) -> Booking:
    """Create a PENDING / UNPAID booking and hold the slot for BOOKING_HOLD_MINUTES.

    Checks the psychologist, time, slot and AI session (422); the price comes
    from the psychologist profile. Raises 422, 503 if the slot is taken.
    Route: POST /api/bookings
    """
    raise NotImplementedError


async def get_booking_for_user(
        db: AsyncSession,
        booking_id: UUID,
        user: User,
) -> Booking:
    """Return a booking to its client, its psychologist or an admin.

    Anybody else gets 404. meet_link is filled only for CONFIRMED and later.
    Route: GET /api/bookings/{booking_id}
    """
    raise NotImplementedError


async def list_bookings_for_user(
        db: AsyncSession,
        user: User,
        booking_status: BookingStatus | None,
        limit: int,
        offset: int,
) -> tuple[list[Booking], int]:
    """Return the user's own bookings and the total, optionally by status.

    Route: GET /api/bookings
    """
    raise NotImplementedError


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
    raise NotImplementedError


async def mark_paid(
        db: AsyncSession,
        booking_id: UUID,
        provider: PaymentProviderName,
        provider_session_id: str,
        payment_reference: str | None,
        paid_at: datetime,
) -> Booking:
    """PENDING / UNPAID -> CONFIRMED / HELD. Idempotent. Raises 404, 409.

    Route: POST /api/payments/webhook/{provider} ("paid" event)
    """
    raise NotImplementedError


async def mark_payment_failed(
        db: AsyncSession,
        booking_id: UUID,
) -> Booking:
    """PENDING -> CANCELLED, slot freed. Idempotent. Raises 404, 409.

    Route: POST /api/payments/webhook/{provider} ("failed" and "expired" events)
    """
    raise NotImplementedError


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
    raise NotImplementedError


async def mark_disputed(
        db: AsyncSession,
        booking_id: UUID,
        admin: User,
        note: str,
) -> Booking:
    """CONFIRMED / COMPLETED (HELD) -> DISPUTED; payout skips it.

    The note and the admin are only logged for now. Raises 404, 409.
    Route: POST /api/bookings/{booking_id}/dispute
    """
    raise NotImplementedError


async def resolve_dispute(
        db: AsyncSession,
        booking_id: UUID,
        new_status: BookingStatus,
        admin: User,
) -> Booking:
    """DISPUTED -> COMPLETED or CANCELLED (payment REFUNDED). Raises 404, 409, 422.

    Route: POST /api/bookings/{booking_id}/resolve-dispute
    """
    raise NotImplementedError


async def mark_paid_out(
        db: AsyncSession,
        booking_id: UUID,
        payout_amount: Decimal,
        platform_fee: Decimal,
        payout_reference: str,
        released_at: datetime,
) -> Booking:
    """COMPLETED / HELD -> PAID and store the payout data.

    Idempotent by payout_reference. Raises 404, 409.
    Route: none, called by the automatic payout task.
    """
    raise NotImplementedError


# Called by Celery tasks (no HTTP context)

async def expire_pending_bookings(
        db: AsyncSession,
        now: datetime,
) -> int:
    """Cancel PENDING bookings with hold_expires_at before now; return the count.

    Route: none, called by the task that releases expired holds.
    """
    raise NotImplementedError


async def list_ready_for_payout(
        db: AsyncSession,
        now: datetime,
        session_duration_min: int,
        limit: int,
) -> list[Booking]:
    """Return CONFIRMED / HELD bookings whose session is over, except DISPUTED.

    Over means selected_time + session_duration_min <= now. Rows are locked
    with FOR UPDATE SKIP LOCKED, oldest first, at most limit.
    Route: none, called by the automatic payout task.
    """
    raise NotImplementedError


async def mark_completed(
        db: AsyncSession,
        booking_id: UUID,
        completed_at: datetime,
) -> Booking:
    """CONFIRMED -> COMPLETED and store completed_at. Idempotent.

    Route: none, called by the automatic payout task.
    """
    raise NotImplementedError
