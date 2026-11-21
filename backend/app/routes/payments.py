import logging
from datetime import datetime, timezone, timedelta
from typing import Annotated
from urllib.parse import urlencode
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
    Request,
    Response
)
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

from config.dependencies import (
    get_payment_provider,
    get_settings
)
from database.models.models import (
    User,
    Language,
    Booking,
    BookingStatus,
    PaymentStatus
)
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import PaymentProviderName
from schemas.payments import CheckoutRequest, CheckoutResponse
from auth.dependencies import get_current_user
from services.payment_service import (
    create_checkout_service,
    handle_webhook
)
from starlette.responses import JSONResponse
from exceptions.base import AppError
from config.settings import BaseAppSettings

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    status_code=status.HTTP_200_OK
)
async def create_checkout(
        db: Annotated[AsyncSession, Depends(get_db)],
        client: Annotated[User, Depends(get_current_user)],
        payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        data: CheckoutRequest
) -> CheckoutResponse:
    return await create_checkout_service(
        db=db,
        client=client,
        payment_provider=payment_provider,
        data=data
    )


@router.post(
    "/webhook/{provider}",
    status_code=status.HTTP_200_OK
)
async def webhook(
        db: Annotated[AsyncSession, Depends(get_db)],
        payment_provider: Annotated[PaymentProviderInterface, Depends(get_payment_provider)],
        provider: PaymentProviderName,
        request: Request,
):
    if provider != payment_provider.name:
        logger.warning(
            "Rejected %s webhook: the active provider is %s",
            provider.value, payment_provider.name.value
        )
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "WEBHOOK_PROVIDER_NOT_ACTIVE",
            "Webhook provider is not active.",
        )
    payload = await request.body()
    headers = request.headers

    response = await handle_webhook(
        db=db,
        payment_provider=payment_provider,
        provider=provider,
        payload=payload,
        headers=headers
    )
    if not response.body:
        return Response(status_code=response.status_code)
    return JSONResponse(
        status_code=response.status_code,
        content=response.body
    )


@router.get("/return/wayforpay")
@router.post("/return/wayforpay")
async def wayforpay_return(
        request: Request,
        db: Annotated[AsyncSession, Depends(get_db)],
        settings: Annotated[BaseAppSettings, Depends(get_settings)],
        lang: Language = Query(default=Language.UKRAINIAN)
):
    form = await request.form()
    order_reference = form.get("orderReference")
    if not isinstance(order_reference, str) or "_" not in order_reference:
        order_reference = None
    transaction_status = form.get("transactionStatus")
    reason_code_str = form.get("reasonCode")
    if isinstance(reason_code_str, str) and reason_code_str.isdecimal():
        reason_code = int(reason_code_str)
    else:
        reason_code = None
    logger.info(
        "WayForPay return: order=%s transactionStatus=%s reasonCode=%s",
        order_reference, transaction_status, reason_code
    )
    if (
        transaction_status == "Approved"
        or reason_code == 1100
    ):
        if order_reference:
            booking_id = order_reference.rpartition("_")[0]
            url_target = (
                settings.SUCCESS_PAYMENTS_REDIRECT
                + f"?booking_id={booking_id}"
            )
            return RedirectResponse(
                url=url_target,
                status_code=status.HTTP_303_SEE_OTHER
            )
        return RedirectResponse(
            url=settings.SUCCESS_PAYMENTS_REDIRECT,
            status_code=status.HTTP_303_SEE_OTHER
        )
    elif (
        reason_code == 1125
    ):
        params = {"lang": lang.value}
        if order_reference:
            now = datetime.now(timezone.utc)
            booking_id = order_reference.rpartition("_")[0]
            try:
                booking_id = UUID(booking_id)
            except ValueError:
                params["reason"] = "expired"
                booking = None
            else:
                booking = await db.get(Booking, booking_id)
            if booking is not None:
                params["booking_id"] = booking.id
            if (
                booking is None
                or booking.hold_expires_at is None
                or booking.hold_expires_at - now < timedelta(minutes=2)
                or booking.status != BookingStatus.PENDING
                or booking.payment_status != PaymentStatus.UNPAID
            ):
                params["reason"] = "expired"
            url_target = (
                f"{settings.CANCEL_PAYMENTS_REDIRECT}"
                f"?{urlencode(params)}"
            )
            return RedirectResponse(
                url=url_target,
                status_code=status.HTTP_303_SEE_OTHER
            )
