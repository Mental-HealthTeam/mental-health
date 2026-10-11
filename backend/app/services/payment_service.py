
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import Booking, Psychologist
from payment_provider.payment_interface import (
    CheckoutParams,
    PaymentProviderInterface,
)


class PaymentService:

    def __init__(
        self,
        db: AsyncSession,
        payment_provider: PaymentProviderInterface,
    ):
        self._db = db
        self._payment_provider = payment_provider

    async def create_checkout(
        self,
        booking_id: UUID,
    ):
        result = await self._db.execute(
            select(Booking).where(Booking.id == booking_id)
        )
        booking = result.scalar_one_or_none()

        if booking is None:
            raise ValueError("Booking not found")

        psychologist_result = await self._db.execute(
            select(Psychologist).where(
                Psychologist.psychologist_id
                == booking.psychologist_id
            )
        )
        psychologist = psychologist_result.scalar_one_or_none()

        if psychologist is None:
            raise ValueError("Psychologist not found")

        amount = int(booking.price * 100)

        params = CheckoutParams(
            booking_id=str(booking.id),
            amount=amount,
            currency=booking.currency,
            psychologist_name=psychologist.full_name,
            success_url=self._payment_provider._settings.STRIPE_SUCCESS_URL,
            cancel_url=self._payment_provider._settings.STRIPE_CANCEL_URL,
        )

        return await self._payment_provider.create_checkout_session(
            params=params,
        )

    async def handle_webhook(
        self,
        payload: bytes,
        signature: str,
    ) -> dict:
        webhook = self._payment_provider.parse_webhook(
            payload=payload,
            signature=signature,
        )

        if webhook.event_type != "checkout.session.completed":
            return {"status": "success"}

        if webhook.payment_status != "paid":
            return {"status": "payment_not_completed"}

        return {
            "status": "payment_completed",
            "booking_id": webhook.metadata.get("booking_id"),
        }
