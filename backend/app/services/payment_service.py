from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.models import Psychologist
from payment_provider.payment_interface import PaymentProviderInterface


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
        psychologist_id: UUID,
        selected_time: str,
    ) -> str:
        result = await self._db.execute(
            select(Psychologist).where(
                Psychologist.psychologist_id == psychologist_id
            )
        )

        psychologist = result.scalar_one_or_none()

        if psychologist is None:
            raise ValueError("Psychologist not found")

        amount = int(
            psychologist.price_per_hour * 100
        )

        return await self._payment_provider.create_checkout(
            psychologist_id=psychologist.psychologist_id,
            selected_time=selected_time,
            amount=amount,
            psychologist_name=psychologist.full_name,
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
            return {
                "status": "payment_not_completed",
            }

        return {
            "status": "payment_completed",
            "selected_time": webhook.metadata.get(
                "selected_time"
            ),
        }
