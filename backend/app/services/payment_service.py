import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from config.settings import Settings
from database.models.models import Booking, Psychologist


settings = Settings()

stripe.api_key = settings.STRIPE_SECRET_KEY


async def create_checkout_session(
    db: AsyncSession,
    booking_id: UUID,
) -> str:
    result = await db.execute(
        select(Booking, Psychologist)
        .join(
            Psychologist,
            Psychologist.psychologist_id == Booking.psychologist_id,
        )
        .where(Booking.id == booking_id)
    )

    row = result.one_or_none()

    if row is None:
        raise ValueError("Booking not found")

    booking, psychologist = row

    amount = int(booking.price * 100)

    checkout_session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": booking.currency.lower(),
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
            "booking_id": str(booking.id),
        },
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
    )

    return checkout_session.url
