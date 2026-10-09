from uuid import UUID

import stripe

from config.settings import Settings
from payment_provider.payment_interface import (
    PaymentProviderInterface,
    PaymentWebhook,
)


class StripePaymentProvider(PaymentProviderInterface):

    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = stripe.StripeClient(
            settings.STRIPE_SECRET_KEY,
        )

    async def create_checkout(
        self,
        psychologist_id: UUID,
        selected_time: str,
        amount: int,
        psychologist_name: str,
    ) -> str:
        checkout_session = await (
            self._client.v1.checkout.sessions.create_async(
                params={
                    "mode": "payment",
                    "line_items": [
                        {
                            "price_data": {
                                "currency": "uah",
                                "product_data": {
                                    "name": (
                                        "Consultation with "
                                        f"{psychologist_name}"
                                    ),
                                },
                                "unit_amount": amount,
                            },
                            "quantity": 1,
                        }
                    ],
                    "metadata": {
                        "psychologist_id": str(
                            psychologist_id
                        ),
                        "selected_time": selected_time,
                    },
                    "success_url": (
                        f"{self._settings.STRIPE_SUCCESS_URL}"
                        "?session_id={CHECKOUT_SESSION_ID}"
                    ),
                    "cancel_url": (
                        self._settings.STRIPE_CANCEL_URL
                    ),
                },
            )
        )

        return checkout_session.url

    def parse_webhook(
        self,
        payload: bytes,
        signature: str,
    ) -> PaymentWebhook:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            self._settings.STRIPE_WEBHOOK_SECRET,
        )

        if event["type"] != "checkout.session.completed":
            return PaymentWebhook(
                event_type=event["type"],
                payment_status=None,
                provider_session_id="",
                metadata={},
            )

        session = event["data"]["object"]

        return PaymentWebhook(
            event_type=event["type"],
            payment_status=session.payment_status,
            provider_session_id=session.id,
            metadata=dict(session.metadata or {}),
        )
