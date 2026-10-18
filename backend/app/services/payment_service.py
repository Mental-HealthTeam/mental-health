import logging
from datetime import datetime, timezone
from collections.abc import Mapping
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    User,
    BookingStatus,
    PaymentStatus,
    PaymentEvent,
    Booking
)
from schemas.payments import CheckoutRequest, CheckoutResponse
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import (
    PaymentProviderName,
    WebhookAcknowledgement,
    CheckoutParams,
    PaymentEventType,
    PaymentWebhook
)
from services.booking_service import (
    get_booking_for_user,
    find_booking_by_payment,
    mark_paid,
    mark_payment_failed,
    mark_cancelled
)
from exceptions.payments import (
    PaymentProviderError,
    WebhookVerificationError
)

logger = logging.getLogger(__name__)


async def create_checkout_service(
        db: AsyncSession,
        client: User,
        payment_provider: PaymentProviderInterface,
        data: CheckoutRequest
) -> CheckoutResponse:
    booking = await get_booking_for_user(
        db=db,
        booking_id=data.booking_id,
        user=client
    )
    if booking.client_id != client.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found."
        )
    if (
        booking.status != BookingStatus.PENDING or
        booking.payment_status != PaymentStatus.UNPAID
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Booking cannot be paid in its current state."
        )
    if not booking.hold_expires_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Booking hold is missing, create a new booking."
        )
    else:
        if booking.hold_expires_at <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Booking hold has expired, create a new booking."
            )
    check_out_params = CheckoutParams(
        booking_id=booking.id,
        amount=booking.price,
        currency=booking.currency,
        description="Consultation with psychologist"
    )
    try:
        check_out_result = await payment_provider.create_checkout_session(
            params=check_out_params
        )
    except PaymentProviderError as e:
        logger.error(
            "Checkout failed for booking %s (provider=%s): %s",
            booking.id, payment_provider.name.value, e
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider is unavailable, try again later."
        ) from e
    try:
        booking.payment_provider = payment_provider.name
        booking.provider_session_id = check_out_result.session_id
        await db.commit()
    except SQLAlchemyError as e:
        logger.exception(
            "Could not save payment session %s for booking %s",
            check_out_result.session_id, booking.id
        )
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the payment session."
        ) from e

    return CheckoutResponse(
        session_id=check_out_result.session_id,
        checkout_url=check_out_result.checkout_url
    )


def create_payment_event(
    provider: PaymentProviderName,
    response_webhook: PaymentWebhook,
    booking_id: UUID | None = None
) -> PaymentEvent:
    payment_event = PaymentEvent(
        provider=provider,
        event_id=response_webhook.event_id,
        booking_id=booking_id,
        event_type=response_webhook.event_type,
    )
    return payment_event


async def find_booking(
    db: AsyncSession,
    provider: PaymentProviderName,
    response_webhook: PaymentWebhook
) -> Booking | None:
    booking = await find_booking_by_payment(
        db=db,
        provider=provider,
        provider_session_id=response_webhook.provider_session_id,
        payment_reference=response_webhook.payment_reference
    )
    if not booking:
        if response_webhook.booking_id:
            booking = await db.get(Booking, response_webhook.booking_id)
    return booking


async def booking_action(
        db: AsyncSession,
        response_webhook: PaymentWebhook,
        booking: Booking,
        provider: PaymentProviderName
) -> None:
    try:
        if response_webhook.event_type == PaymentEventType.PAID:
            await mark_paid(
                db=db,
                booking_id=booking.id,
                provider=provider,
                provider_session_id=response_webhook.provider_session_id,
                payment_reference=response_webhook.payment_reference,
                paid_at=datetime.now(timezone.utc)
            )
            logger.info(
                "%s webhook %s: booking %s marked as paid",
                provider.value, response_webhook.event_id, booking.id
            )
        if response_webhook.event_type in (
                PaymentEventType.EXPIRED,
                PaymentEventType.FAILED
        ):
            await mark_payment_failed(
                db=db,
                booking_id=booking.id,
            )
            logger.info(
                "%s webhook %s: booking %s cancelled after a failed or expired payment",
                provider.value, response_webhook.event_id, booking.id
            )
        if response_webhook.event_type == PaymentEventType.REFUNDED:
            await mark_cancelled(
                db=db,
                booking_id=booking.id,
                refunded=True
            )
            logger.info(
                "%s webhook %s: booking %s cancelled and refunded",
                provider.value, response_webhook.event_id, booking.id
            )
    except HTTPException as e:
        await db.commit()
        if response_webhook.event_type == PaymentEventType.PAID:
            logger.error(
                "%s webhook %s: booking %s cannot be marked as paid (%s), manual refund needed",
                provider.value, response_webhook.event_id, booking.id, e.detail
            )
        else:
            logger.warning(
                "%s webhook %s: %s event not applied to booking %s (%s)",
                provider.value, response_webhook.event_id,
                response_webhook.event_type.value, booking.id, e.detail
            )


async def payment_flow(
        db: AsyncSession,
        response_webhook: PaymentWebhook,
        booking: Booking,
        provider: PaymentProviderName
) -> None:
    if response_webhook.event_type in (
            PaymentEventType.PAID,
            PaymentEventType.REFUNDED,
            PaymentEventType.FAILED,
            PaymentEventType.EXPIRED
    ):
        if response_webhook.event_type == PaymentEventType.PAID:
            amount = response_webhook.metadata.get("amount")
            if amount:
                amount = Decimal(amount)
                if amount != booking.price:
                    logger.error(
                        "%s webhook %s: paid amount %s does not match booking %s price %s",
                        provider.value, response_webhook.event_id, amount, booking.id, booking.price
                    )
                    payment_event = create_payment_event(
                        provider=provider,
                        response_webhook=response_webhook,
                        booking_id=booking.id
                    )
                    db.add(payment_event)
                    await db.commit()
                    return
        payment_event = create_payment_event(
            provider=provider,
            response_webhook=response_webhook,
            booking_id=booking.id
        )
        db.add(payment_event)
        await booking_action(
            db=db,
            response_webhook=response_webhook,
            booking=booking,
            provider=provider
        )


async def handle_webhook(
        db: AsyncSession,
        payment_provider: PaymentProviderInterface,
        provider: PaymentProviderName,
        payload: bytes,
        headers: Mapping[str, str]
) -> WebhookAcknowledgement:
    try:
        response_webhook = payment_provider.verify_webhook_event(
            payload=payload,
            headers=headers
        )
    except WebhookVerificationError as e:
        logger.warning(
            "Rejected %s webhook: invalid signature or payload",
            provider.value
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook."
        ) from e

    stmt = select(PaymentEvent).where(
        PaymentEvent.provider == provider,
        PaymentEvent.event_id == response_webhook.event_id
    )
    response = await db.execute(stmt)
    payment_event = response.scalar_one_or_none()
    if payment_event:
        acknowledgement = payment_provider.build_webhook_response(
            event=response_webhook
        )
        return acknowledgement
    if response_webhook.event_type == PaymentEventType.IGNORED:
        logger.info(
            "%s webhook %s ignored",
            provider.value, response_webhook.event_id
        )
        acknowledgement = payment_provider.build_webhook_response(
            event=response_webhook
        )
        return acknowledgement
    booking = await find_booking(
        db=db,
        provider=provider,
        response_webhook=response_webhook
    )
    try:
        if not booking:
            logger.warning(
                "%s webhook %s: booking not found",
                provider.value, response_webhook.event_id
            )
            payment = create_payment_event(
                provider=provider,
                response_webhook=response_webhook,
                booking_id=None
            )
            db.add(payment)
            await db.commit()
            acknowledgement = payment_provider.build_webhook_response(
                event=response_webhook
            )
            return acknowledgement
        await payment_flow(
            db=db,
            response_webhook=response_webhook,
            booking=booking,
            provider=provider
        )
    except IntegrityError:
        await db.rollback()
        logger.info(
            "%s webhook %s already recorded by a parallel request",
            provider.value, response_webhook.event_id
        )
    except SQLAlchemyError as e:
        logger.exception(
            "%s webhook %s: database error",
            provider.value, response_webhook.event_id
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the payment event."
        ) from e

    acknowledgement = payment_provider.build_webhook_response(
        event=response_webhook
    )
    return acknowledgement
