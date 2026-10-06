import stripe

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import Settings
from database import get_db
from services.payment_service import create_checkout_session


settings = Settings()

router = APIRouter()


class CheckoutRequest(BaseModel):
    psychologist_id: UUID
    selected_time: str


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
async def stripe_webhook(request: Request):
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
    except (
        ValueError,
        stripe.error.SignatureVerificationError,
    ) as error:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook",
        ) from error

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        if session.get("payment_status") != "paid":
            return {
                "status": "payment_not_completed",
            }

        return {
            "status": "payment_completed",
            "selected_time": session.get("metadata", {}).get(
                "selected_time"
            ),
        }

    return {"status": "success"}
