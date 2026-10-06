import stripe

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import Settings
from database import get_db
from database.models.models import (
    Booking,
    BookingStatus,
    PaymentStatus,
)
from services.payment_service import create_checkout_session


settings = Settings()

router = APIRouter()


class CheckoutRequest(BaseModel):
    booking_id: UUID


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
)
async def create_checkout(
    body: CheckoutRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        checkout_url = await create_checkout_session(
            db=db,
            booking_id=body.booking_id,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

    return CheckoutResponse(
        checkout_url=checkout_url,
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if signature is None:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as error:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook",
        ) from error

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        booking_id = session.get("metadata", {}).get("booking_id")

        if not booking_id:
            raise HTTPException(
                status_code=400,
                detail="booking_id is missing in Stripe metadata",
            )

        result = await db.execute(
            select(Booking).where(
                Booking.id == UUID(booking_id)
            )
        )

        booking = result.scalar_one_or_none()

        if booking is None:
            raise HTTPException(
                status_code=404,
                detail="Booking not found",
            )

        booking.payment_status = PaymentStatus.PAID
        booking.status = BookingStatus.CONFIRMED

        await db.commit()

    return {"status": "success"}
