import logging
from datetime import datetime, timezone, timedelta
from collections.abc import Mapping
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import (
    User,
    UserRole,
    BookingStatus,
    PaymentStatus,
    PaymentEvent,
    Booking,
    PsychologistStatus
)
from schemas.payments import CheckoutRequest, CheckoutResponse
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import (
    PaymentProviderName,
    WebhookAcknowledgement,
    CheckoutParams,
    PaymentEventType,
    PaymentWebhook,
    Recipient,
    PayoutRequest,
    PayoutStatus,
    RefundRequest
)
from services.booking_service import (
    get_booking_for_user,
    find_booking_by_payment,
    mark_paid,
    mark_payment_failed,
    mark_cancelled,
    list_ids_ready_for_payout,
    list_ready_for_payout,
    mark_paid_out,
    mark_completed,
    mark_refund_failed,
    mark_dispute_refunded
)
from exceptions.payments import (
    PaymentProviderError,
    WebhookVerificationError
)

from config.settings import BaseAppSettings


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
        elif booking.hold_expires_at <= datetime.now(timezone.utc) + timedelta(minutes=2):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The booking hold expires in less than 2 minutes. "
                       "Create a new booking after it expires."
            )
    check_out_params = CheckoutParams(
        booking_id=booking.id,
        amount=booking.price,
        currency=booking.currency,
        description="Consultation with psychologist",
        hold_expires_at=booking.hold_expires_at
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


def _create_payment_event(
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


async def _find_booking(
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


async def _booking_action(
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
        if response_webhook.event_type == PaymentEventType.EXPIRED:
            await mark_payment_failed(
                db=db,
                booking_id=booking.id,
            )
            logger.info(
                "%s webhook %s: booking %s cancelled after an expired payment",
                provider.value, response_webhook.event_id, booking.id
            )
        if response_webhook.event_type == PaymentEventType.REFUNDED:
            if booking.status == BookingStatus.DISPUTED:
                await mark_dispute_refunded(
                    db=db,
                    booking_id=booking.id,
                )
                logger.info(
                    "%s webhook %s: disputed booking %s refunded by the provider, dispute closed",
                    provider.value, response_webhook.event_id, booking.id
                )
            else:
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


async def _payment_flow(
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
                    payment_event = _create_payment_event(
                        provider=provider,
                        response_webhook=response_webhook,
                        booking_id=booking.id
                    )
                    db.add(payment_event)
                    await db.commit()
                    return
        payment_event = _create_payment_event(
            provider=provider,
            response_webhook=response_webhook,
            booking_id=booking.id
        )
        db.add(payment_event)
        if response_webhook.event_type == PaymentEventType.FAILED:
            await db.commit()
            logger.info(
                "%s webhook %s: payment attempt for booking %s declined, booking stays pending",
                provider.value, response_webhook.event_id, booking.id
            )
            return
        await _booking_action(
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
    booking = await _find_booking(
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
            payment = _create_payment_event(
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
        await _payment_flow(
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


def _set_reference_payout_for_bookings(
    bookings: list[Booking],
    reference: str
):
    for booking in bookings:
        booking.payout_reference = reference


def _calculate_payout(
        bookings: list[Booking],
        fee_percent: int
) -> tuple[Decimal, dict]:
    amount = Decimal(0)
    payout_sums = {}
    for booking in bookings:
        platform_fee = (
            booking.price * Decimal(fee_percent) / Decimal(100)
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        payout_amount = booking.price - platform_fee
        amount += payout_amount
        payout_sums[booking.id] = (payout_amount, platform_fee)
    return amount, payout_sums


async def payout_service(
        db: AsyncSession,
        payment_provider: PaymentProviderInterface,
        settings: BaseAppSettings
) -> None:
    now = datetime.now(timezone.utc)
    now_ukraine_tz = now.astimezone(ZoneInfo(settings.CELERY_TIMEZONE))
    if settings.PLATFORM_FEE_PERCENT <= 0:
        logger.error(
            "Monthly payout skipped: PLATFORM_FEE_PERCENT must be positive, got %s",
            settings.PLATFORM_FEE_PERCENT
        )
        return
    psychologist_ids = await list_ids_ready_for_payout(db=db)
    errors_payout = 0
    paid_count = 0
    skipped_count = 0
    failed_count = 0
    total_paid = Decimal(0)
    for psychologist_id in psychologist_ids:
        bookings = await list_ready_for_payout(
            db=db,
            psychologist_id=psychologist_id
        )
        if not bookings:
            continue
        if bookings[0].psychologist.profile_status != PsychologistStatus.ACTIVE:
            skipped_count += 1
            logger.warning(
                "Payout skipped for psychologist %s: profile is %s, %s bookings are waiting",
                psychologist_id, bookings[0].psychologist.profile_status.value, len(bookings)
            )
            continue
        try:
            amount, payout_sums = _calculate_payout(
                bookings=bookings,
                fee_percent=settings.PLATFORM_FEE_PERCENT
            )
            payout_date = now_ukraine_tz.date().strftime("%Y%m%d")
            reference_amount = int(amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) * 100)
            reference = f"payout_{psychologist_id}_{payout_date}_{reference_amount}"
            _set_reference_payout_for_bookings(
                bookings=bookings,
                reference=reference
            )
            await db.commit()
        except SQLAlchemyError:
            errors_payout += 1
            failed_count += 1
            await db.rollback()
            logger.exception(
                "Payout for psychologist %s not started: could not save the payout reference",
                psychologist_id
            )
            if errors_payout >= 3:
                logger.error(
                    "Monthly payout stopped after %s failures in a row",
                    errors_payout
                )
                return
            continue
        try:
            recipient = Recipient(
                iban=bookings[0].psychologist.iban,
                tax_id=bookings[0].psychologist.tax_id,
                account_name=bookings[0].psychologist.account_name,
            )
            request = PayoutRequest(
                reference=reference,
                amount=amount,
                currency=settings.WAYFORPAY_CURRENCY,
                recipient=recipient
            )
            payout_result = await payment_provider.payout(
                request=request
            )

            if payout_result.status in (
                    PayoutStatus.PAID,
                    PayoutStatus.PENDING,
                    PayoutStatus.SIMULATED
            ):
                for booking in bookings:
                    await mark_paid_out(
                        db=db,
                        booking_id=booking.id,
                        payout_amount=payout_sums[booking.id][0],
                        platform_fee=payout_sums[booking.id][1],
                        released_at=now_ukraine_tz
                    )
                errors_payout = 0
                paid_count += 1
                total_paid += amount
                logger.info(
                    "Payout %s for psychologist %s: %s bookings, amount %s, status %s",
                    reference, psychologist_id, len(bookings), amount, payout_result.status.value
                )
        except (SQLAlchemyError, HTTPException, PaymentProviderError) as e:
            errors_payout += 1
            failed_count += 1
            if isinstance(e, SQLAlchemyError):
                await db.rollback()
                logger.exception(
                    "Payout %s for psychologist %s was paid by the provider but not recorded, "
                    "manual check needed",
                    reference, psychologist_id
                )
            if isinstance(e, HTTPException):
                logger.error(
                    "Payout %s for psychologist %s was paid by the provider but not recorded (%s), "
                    "manual check needed",
                    reference, psychologist_id, e.detail
                )
            if isinstance(e, PaymentProviderError):
                logger.error(
                    "Payout %s for psychologist %s failed: %s",
                    reference, psychologist_id, e
                )
            if errors_payout >= 3:
                logger.error(
                    "Monthly payout stopped after %s failures in a row",
                    errors_payout
                )
                return
        except ValueError:
            # Pydantic ValidationError is a ValueError: invalid payout details,
            # the payout was not sent. A data problem of one psychologist,
            # so it does not count towards stopping the whole run.
            # The error text is not logged: it contains the IBAN and tax id.
            failed_count += 1
            logger.error(
                "Payout %s for psychologist %s not sent: invalid payout details, manual check needed",
                reference, psychologist_id
            )

    logger.info(
        "Monthly payout finished: paid %s, skipped %s, failed %s, total amount %s",
        paid_count, skipped_count, failed_count, total_paid
    )


def _refund_allowed(
        user: User,
        booking: Booking,
        now: datetime,
        settings: BaseAppSettings,
        confirm_no_refund: bool
) -> bool:
    refund_allowed = False
    if booking.selected_time < now:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The session has already started, the booking cannot be cancelled."
        )
    if user.role in (UserRole.ADMIN, UserRole.PSYCHOLOGIST):
        refund_allowed = True
    else:
        time_left = booking.selected_time - now
        if time_left < timedelta(hours=settings.BOOKING_FREE_CANCEL_HOURS):
            if not confirm_no_refund:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"The session starts in less than {settings.BOOKING_FREE_CANCEL_HOURS} hours, "
                        "the payment will not be refunded. Confirm to cancel."
                    )
                )
        else:
            refund_allowed = True
    return refund_allowed


async def cancel_booking_service(
        db: AsyncSession,
        user: User,
        payment_provider: PaymentProviderInterface,
        settings: BaseAppSettings,
        booking_id: UUID,
        confirm_no_refund: bool = False
) -> Booking:
    now = datetime.now(ZoneInfo(settings.CELERY_TIMEZONE))
    booking = await get_booking_for_user(
        db=db,
        booking_id=booking_id,
        user=user
    )
    if booking.status == BookingStatus.CANCELLED:
        return booking
    if booking.payment_status == PaymentStatus.UNPAID:
        if (
                booking.payment_provider
                and booking.hold_expires_at is not None
                and booking.hold_expires_at > now
        ):
            logger.info(
                "Cancel of booking %s rejected for user %s: payment is in progress, hold expires at %s",
                booking_id, user.id, booking.hold_expires_at
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Payment for this booking is in progress. "
                    "If you do not pay, it will be cancelled automatically when the hold expires."
                )
            )
        try:
            booking = await mark_cancelled(
                db=db,
                booking_id=booking.id,
                refunded=False
            )
        except SQLAlchemyError as e:
            logger.exception(
                "Could not cancel unpaid booking %s",
                booking_id
            )
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not cancel the booking."
            ) from e
        logger.info("Unpaid booking %s cancelled by user %s", booking_id, user.id)
        return booking
    if booking.payment_status != PaymentStatus.HELD:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The booking cannot be cancelled automatically, contact support."
        )
    refund_allowed = _refund_allowed(
        user=user,
        booking=booking,
        now=now,
        settings=settings,
        confirm_no_refund=confirm_no_refund
    )
    if booking.payment_status == PaymentStatus.HELD and not refund_allowed:
        try:
            booking = await mark_completed(
                db=db,
                booking_id=booking.id,
                completed_at=now
            )
            logger.info(
                "Booking %s cancelled late by the client: no refund, the session is paid out "
                "to the psychologist",
                booking_id
            )
            return booking
        except SQLAlchemyError as e:
            logger.exception(
                "Could not complete late-cancelled booking %s",
                booking_id
            )
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not cancel the booking."
            ) from e
    if booking.payment_status == PaymentStatus.HELD and refund_allowed:
        try:
            if not booking.payment_reference:
                logger.error(
                    "Booking %s is paid but has no payment reference, refund is not possible",
                    booking_id
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="The payment for this booking cannot be refunded automatically, contact support."
                )
            locked_booking = (await db.execute(
                select(Booking)
                .where(Booking.id == booking_id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )).scalar_one_or_none()
            if locked_booking.status == BookingStatus.CANCELLED:
                await db.commit()
                return booking
            booking = await mark_cancelled(
                db=db,
                booking_id=booking.id,
                refunded=False
            )
            refund_request = RefundRequest(
                payment_reference=booking.payment_reference,
                amount=booking.price,
                reason="Booking canceled"
            )
            await payment_provider.refund(refund_request)
            booking = await mark_cancelled(
                db=db,
                booking_id=booking.id,
                refunded=True
            )
            logger.info(
                "Booking %s cancelled and refunded (amount %s)",
                booking_id, booking.price
            )
            return booking
        except SQLAlchemyError as e:
            logger.exception(
                "Could not save the cancellation or refund of booking %s, manual check needed",
                booking_id
            )
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not cancel the booking, contact support."
            ) from e
        except PaymentProviderError as e:
            logger.error(
                "Refund failed for booking %s, manual check needed: %s",
                booking_id, e
            )
            try:
                await mark_refund_failed(
                    db=db,
                    booking_id=booking.id
                )
            except SQLAlchemyError:
                await db.rollback()
                logger.exception(
                    "Could not mark the failed refund of booking %s, manual check needed",
                    booking_id
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The refund failed, contact support."
            ) from e
