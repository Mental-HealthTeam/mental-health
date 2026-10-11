
import stripe

from config.settings import Settings
from payment_provider.payment_interface import (
    CheckoutParams,
    CheckoutResponse,
    PaymentProviderInterface,
    PaymentWebhook,
)


class StripePaymentProvider(PaymentProviderInterface):

    def __init__(self, settings: Settings):
        self._settings = settings
        self._client = stripe.StripeClient(
            settings.STRIPE_SECRET_KEY,
        )

    async def create_checkout_session(
        self,
        params: CheckoutParams,
    ) -> CheckoutResponse:
        checkout_session = await (
            self._client.v1.checkout.sessions.create_async(
                params={
                    "mode": "payment",
                    "line_items": [
                        {
                            "price_data": {
                                "currency": params.currency.lower(),
                                "product_data": {
                                    "name": (
                                        "Consultation with "
                                        f"{params.psychologist_name}"
                                    ),
                                },
                                "unit_amount": params.amount,
                            },
                            "quantity": 1,
                        }
                    ],
                    "metadata": {
                        "booking_id": params.booking_id,
                    },
                    "success_url": (
                        f"{params.success_url}"
                        "?session_id={CHECKOUT_SESSION_ID}"
                    ),
                    "cancel_url": params.cancel_url,
                },
            )
        )

        if not checkout_session.url:
            raise ValueError(
                "Stripe did not return a checkout URL"
            )

        return CheckoutResponse(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url,
        )

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
