import asyncio
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from uuid import UUID

import pytest
import stripe

from schemas.payments import CheckoutRequest
from payment_provider.payment_types import (
    CheckoutParams,
    PaymentEventType,
    PaymentProviderName,
)
from payment_provider.stripe_provider import StripePaymentProvider
from exceptions.payments import WebhookVerificationError


BOOKING_ID = UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def stripe_provider():
    return StripePaymentProvider(
        api_key="sk_test_fake_key_for_tests",
        webhook_secret="whsec_test_secret_for_tests",
        success_url="https://example.com/success",
        cancel_url="https://example.com/cancel",
    )


def make_checkout_params():
    return CheckoutParams(
        booking_id=BOOKING_ID,
        amount=Decimal("100.00"),
        currency="UAH",
        description="Consultation with psychologist",
        hold_expires_at=datetime(2026, 12, 1, tzinfo=timezone.utc),
        language="uk",
    )


def make_stripe_event(
    event_type="checkout.session.completed",
    payment_status="paid",
):
    return {
        "id": "evt_test_123",
        "type": event_type,
        "data": {
            "object": {
                "id": "cs_test_123",
                "payment_intent": "pi_test_123",
                "payment_status": payment_status,
                "metadata": {
                    "booking_id": str(BOOKING_ID),
                },
                "client_reference_id": str(BOOKING_ID),
            }
        },
    }


def test_checkout_request_accepts_booking_id():
    request = CheckoutRequest(
        booking_id=BOOKING_ID,
    )

    assert request.booking_id == BOOKING_ID


def test_checkout_request_defaults_to_ukrainian_language():
    request = CheckoutRequest(
        booking_id=BOOKING_ID,
    )

    assert request.language.value == "uk"


def test_stripe_provider_name(stripe_provider):
    assert stripe_provider.name == PaymentProviderName.STRIPE


def test_stripe_checkout_session_is_created(
    stripe_provider,
    monkeypatch,
):
    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            id="cs_test_123",
            url="https://checkout.stripe.com/test",
        )

    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        fake_create,
    )

    result = asyncio.run(
        stripe_provider.create_checkout_session(
            make_checkout_params()
        )
    )

    assert result.session_id == "cs_test_123"
    assert result.checkout_url == "https://checkout.stripe.com/test"

    assert captured["mode"] == "payment"
    assert captured["metadata"]["booking_id"] == str(BOOKING_ID)
    assert captured["client_reference_id"] == str(BOOKING_ID)


def test_stripe_checkout_amount_is_converted_to_minor_units(
    stripe_provider,
    monkeypatch,
):
    captured = {}

    def fake_create(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            id="cs_test_123",
            url="https://checkout.stripe.com/test",
        )

    monkeypatch.setattr(
        stripe.checkout.Session,
        "create",
        fake_create,
    )

    asyncio.run(
        stripe_provider.create_checkout_session(
            make_checkout_params()
        )
    )

    unit_amount = (
        captured["line_items"][0]["price_data"]["unit_amount"]
    )

    assert unit_amount == 10000


def test_webhook_rejects_missing_signature(stripe_provider):
    with pytest.raises(WebhookVerificationError):
        stripe_provider.verify_webhook_event(
            payload=b"{}",
            headers={},
        )


def test_webhook_rejects_invalid_signature(
    stripe_provider,
    monkeypatch,
):
    def fake_construct_event(*args, **kwargs):
        raise ValueError("Invalid payload")

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        fake_construct_event,
    )

    with pytest.raises(WebhookVerificationError):
        stripe_provider.verify_webhook_event(
            payload=b"{}",
            headers={"stripe-signature": "invalid"},
        )


def test_webhook_returns_paid_event(
    stripe_provider,
    monkeypatch,
):
    event = make_stripe_event()

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        lambda *args, **kwargs: SimpleNamespace(
            to_dict=lambda: event
        ),
    )

    result = stripe_provider.verify_webhook_event(
        payload=b"{}",
        headers={"stripe-signature": "test-signature"},
    )

    assert result.event_id == "evt_test_123"
    assert result.event_type == PaymentEventType.PAID
    assert result.booking_id == BOOKING_ID
    assert result.provider_session_id == "cs_test_123"
    assert result.payment_reference == "pi_test_123"


def test_webhook_does_not_confirm_unpaid_session(
    stripe_provider,
    monkeypatch,
):
    event = make_stripe_event(payment_status="unpaid")

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        lambda *args, **kwargs: SimpleNamespace(
            to_dict=lambda: event
        ),
    )

    result = stripe_provider.verify_webhook_event(
        payload=b"{}",
        headers={"stripe-signature": "test-signature"},
    )

    assert result.event_type == PaymentEventType.IGNORED
    assert result.booking_id is None


def test_webhook_ignores_unknown_event(
    stripe_provider,
    monkeypatch,
):
    event = {
        "id": "evt_unknown",
        "type": "customer.created",
        "data": {
            "object": {},
        },
    }

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        lambda *args, **kwargs: SimpleNamespace(
            to_dict=lambda: event
        ),
    )

    result = stripe_provider.verify_webhook_event(
        payload=b"{}",
        headers={"stripe-signature": "test-signature"},
    )

    assert result.event_type == PaymentEventType.IGNORED
    assert result.booking_id is None


def test_stripe_builds_webhook_acknowledgement(
    stripe_provider,
):
    event = stripe_provider.build_webhook_response(
        event=None,
    )

    assert event.status_code == 200
