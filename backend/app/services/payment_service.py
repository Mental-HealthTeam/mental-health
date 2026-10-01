from decimal import Decimal

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from config.settings import Settings
from database.models.models import Psychologist


settings = Settings()

stripe.api_key = settings.STRIPE_SECRET_KEY


async def create_checkout_session(
    db: AsyncSession,
    psychologist_id: UUID,
    selected_time: str,
) -> str:
    result = await db.execute(
        select(Psychologist).where(
            Psychologist.psychologist_id == psychologist_id
        )
    )

    psychologist = result.scalar_one_or_none()

    if psychologist is None:
        raise ValueError("Psychologist not found")

    amount = int(
        psychologist.price_per_hour * Decimal("100")
    )

    checkout_session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "uah",
                    "product_data": {
                        "name": (
                            f"Consultation with "
                            f"{psychologist.full_name}"
                        ),
                    },
                    "unit_amount": amount,
                },
                "quantity": 1,
            }
        ],
        metadata={
            "psychologist_id": str(
                psychologist.psychologist_id
            ),
            "selected_time": selected_time,
        },
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
    )

    return checkout_session.url
