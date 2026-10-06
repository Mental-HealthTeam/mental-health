import asyncio
import os
import sys
from decimal import Decimal
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

os.environ.setdefault(
    "STRIPE_SECRET_KEY",
    "sk_test_fake_key_for_tests",
)
os.environ.setdefault(
    "STRIPE_WEBHOOK_SECRET",
    "whsec_test_secret_for_tests",
)

import pytest
import stripe
from fastapi import HTTPException
from starlette.requests import Request


PROJECT_ROOT = Path(__file__).resolve().parent.parent
APP_PATH = PROJECT_ROOT / "backend" / "app"

if str(APP_PATH) not in sys.path:
    sys.path.insert(0, str(APP_PATH))


from routes.payments import (  # noqa: E402
    CheckoutRequest,
    create_checkout,
    stripe_webhook,
)
from services import payment_service  # noqa: E402


PSYCHOLOGIST_ID = "11111111-1111-1111-1111-111111111111"
SELECTED_TIME = "2026-10-10 15:00"


def make_psychologist():
    return SimpleNamespace(
        psychologist_id=PSYCHOLOGIST_ID,
        full_name="Test Psychologist",
        price_per_hour=Decimal("100.00"),
    )


def make_db(psychologist=None):
    result = SimpleNamespace(
        scalar_one_or_none=lambda: psychologist,
    )

    db = AsyncMock()
    db.execute = AsyncMock(return_value=result)

    return db


def make_request(payload=b"{}"):
    async def receive():
        return {
            "type": "http.request",
            "body": payload,
            "more_body": False,
        }

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/webhook",
        "headers": [
            (b"stripe-signature", b"test-signature"),
        ],
    }

    return Request(scope, receive)


def test_checkout_request_accepts_psychologist_id_and_selected_time():
    request = CheckoutRequest(
        psychologist_id=PSYCHOLOGIST_ID,
        selected_time=SELECTED_TIME,
    )

    assert str(request.psychologist_id) == PSYCHOLOGIST_ID
    assert request.selected_time == SELECTED_TIME


def test_checkout_returns_404_for_unknown_psychologist():
    db = make_db(psychologist=None)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            create_checkout(
                body=CheckoutRequest(
                    psychologist_id=PSYCHOLOGIST_ID,
                    selected_time=SELECTED_TIME,
                ),
                db=db,
            )
        )

    assert error.value.status_code == 404
    assert error.value.detail == "Psychologist not found"


def test_stripe_session_is_created(monkeypatch):
    psychologist = make_psychologist()
    db = make_db(psychologist)

    captured = {}

    def create_session(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            url="https://checkout.stripe.com/test"
        )

    monkeypatch.setattr(
        payment_service.stripe.checkout.Session,
        "create",
        create_session,
    )

    result = asyncio.run(
        payment_service.create_checkout_session(
            db=db,
            psychologist_id=PSYCHOLOGIST_ID,
            selected_time=SELECTED_TIME,
        )
    )

    assert result == "https://checkout.stripe.com/test"
    assert captured


def test_stripe_metadata_contains_psychologist_id(monkeypatch):
    psychologist = make_psychologist()
    db = make_db(psychologist)

    captured = {}

    def create_session(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            url="https://checkout.stripe.com/test"
        )

    monkeypatch.setattr(
        payment_service.stripe.checkout.Session,
        "create",
        create_session,
    )

    asyncio.run(
        payment_service.create_checkout_session(
            db=db,
            psychologist_id=PSYCHOLOGIST_ID,
            selected_time=SELECTED_TIME,
        )
    )

    assert captured["metadata"]["psychologist_id"] == PSYCHOLOGIST_ID


def test_stripe_metadata_contains_selected_time(monkeypatch):
    psychologist = make_psychologist()
    db = make_db(psychologist)

    captured = {}

    def create_session(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            url="https://checkout.stripe.com/test"
        )

    monkeypatch.setattr(
        payment_service.stripe.checkout.Session,
        "create",
        create_session,
    )

    asyncio.run(
        payment_service.create_checkout_session(
            db=db,
            psychologist_id=PSYCHOLOGIST_ID,
            selected_time=SELECTED_TIME,
        )
    )

    assert captured["metadata"]["selected_time"] == SELECTED_TIME


def test_stripe_amount_is_taken_from_psychologist_price(monkeypatch):
    psychologist = make_psychologist()
    db = make_db(psychologist)

    captured = {}

    def create_session(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            url="https://checkout.stripe.com/test"
        )

    monkeypatch.setattr(
        payment_service.stripe.checkout.Session,
        "create",
        create_session,
    )

    asyncio.run(
        payment_service.create_checkout_session(
            db=db,
            psychologist_id=PSYCHOLOGIST_ID,
            selected_time=SELECTED_TIME,
        )
    )

    unit_amount = (
        captured["line_items"][0]["price_data"]["unit_amount"]
    )

    assert unit_amount == 10000


def test_stripe_product_contains_psychologist_name(monkeypatch):
    psychologist = make_psychologist()
    db = make_db(psychologist)

    captured = {}

    def create_session(**kwargs):
        captured.update(kwargs)

        return SimpleNamespace(
            url="https://checkout.stripe.com/test"
        )

    monkeypatch.setattr(
        payment_service.stripe.checkout.Session,
        "create",
        create_session,
    )

    asyncio.run(
        payment_service.create_checkout_session(
            db=db,
            psychologist_id=PSYCHOLOGIST_ID,
            selected_time=SELECTED_TIME,
        )
    )

    product_name = (
        captured["line_items"][0]
        ["price_data"]
        ["product_data"]
        ["name"]
    )

    assert product_name == "Consultation with Test Psychologist"


def test_checkout_endpoint_returns_checkout_url(monkeypatch):
    expected_url = "https://checkout.stripe.com/test"

    async def fake_create_checkout_session(
        db,
        psychologist_id,
        selected_time,
    ):
        assert str(psychologist_id) == PSYCHOLOGIST_ID
        assert selected_time == SELECTED_TIME

        return expected_url

    monkeypatch.setattr(
        "routes.payments.create_checkout_session",
        fake_create_checkout_session,
    )

    response = asyncio.run(
        create_checkout(
            body=CheckoutRequest(
                psychologist_id=PSYCHOLOGIST_ID,
                selected_time=SELECTED_TIME,
            ),
            db=AsyncMock(),
        )
    )

    assert response.checkout_url == expected_url


def test_webhook_rejects_missing_signature():
    async def receive():
        return {
            "type": "http.request",
            "body": b"{}",
            "more_body": False,
        }

    scope = {
        "type": "http",
        "method": "POST",
        "path": "/webhook",
        "headers": [],
    }

    request = Request(scope, receive)

    with pytest.raises(HTTPException) as error:
        asyncio.run(stripe_webhook(request))

    assert error.value.status_code == 400
    assert error.value.detail == "Missing Stripe signature"


def test_webhook_does_not_confirm_unpaid_session(monkeypatch):
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "payment_status": "unpaid",
                "metadata": {
                    "psychologist_id": PSYCHOLOGIST_ID,
                    "selected_time": SELECTED_TIME,
                },
            }
        },
    }

    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        lambda payload, signature, secret: event,
    )

    request = make_request()

    result = asyncio.run(stripe_webhook(request))

    assert result == {
        "status": "payment_not_completed",
    }
