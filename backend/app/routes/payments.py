from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from config.dependencies import get_payment_provider
from database import get_db
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.payment_types import CheckoutParams, CheckoutResponse
from services.payment_service import PaymentService


router = APIRouter()


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
async def create_checkout(
    body: CheckoutParams,
    db: Annotated[AsyncSession, Depends(get_db)],
    payment_provider: Annotated[
        PaymentProviderInterface,
        Depends(get_payment_provider),
    ],
):
    service = PaymentService(
        db=db,
        payment_provider=payment_provider,
    )

    try:
        checkout_url = await service.create_checkout(
            psychologist_id=body.psychologist_id,
            selected_time=body.selected_time,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    return CheckoutResponse(
        checkout_url=checkout_url,
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    payment_provider: Annotated[
        PaymentProviderInterface,
        Depends(get_payment_provider),
    ],
):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if signature is None:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature",
        )

    service = PaymentService(
        db=db,
        payment_provider=payment_provider,
    )

    try:
        return await service.handle_webhook(
            payload=payload,
            signature=signature,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error
