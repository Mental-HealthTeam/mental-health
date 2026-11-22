import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

import pytest
from freezegun import freeze_time
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from config.dependencies import get_payment_provider
from database.models.models import (
    Booking,
    BookingStatus,
    PaymentEvent,
    PaymentStatus,
)
from exceptions.payments import PaymentProviderError
from payment_provider.payment_types import PaymentProviderName
from payment_provider.wayforpay_signature import calculate_signature

CHECKOUT = "/api/payments/checkout"
WEBHOOK = "/api/payments/webhook/wayforpay"
RETURN = "/api/payments/return/wayforpay"


async def test_checkout_success(
    client, client_user, client_headers, psychologist, make_booking,
    fake_payment, reload,
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 200
    session_id = f"{booking.id}_1"
    assert response.json() == {
        "session_id": session_id,
        "checkout_url": f"https://pay.test/checkout/{session_id}",
    }
    params = fake_payment.checkout_calls[0]
    assert params.booking_id == booking.id
    assert params.amount == booking.price
    assert params.currency == "UAH"
    assert params.language == "uk"
    await reload(booking)
    assert booking.payment_provider == PaymentProviderName.WAYFORPAY
    assert booking.provider_session_id == session_id
    assert booking.status == BookingStatus.PENDING
    assert booking.payment_status == PaymentStatus.UNPAID


async def test_checkout_passes_language(
    client, client_user, client_headers, psychologist, make_booking, fake_payment
):
    booking = await make_booking(client_user, psychologist)

    await client.post(
        CHECKOUT, json={"booking_id": str(booking.id), "language": "en"},
        headers=client_headers,
    )

    assert fake_payment.checkout_calls[0].language == "en"


async def test_checkout_foreign_booking(
    client, client_user, other_client, psychologist, make_booking, auth_headers
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)},
        headers=auth_headers(other_client),
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_checkout_by_psychologist_is_rejected(
    client, client_user, psychologist, psychologist_headers, make_booking
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)},
        headers=psychologist_headers,
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


async def test_checkout_booking_not_found(client, client_headers):
    response = await client.post(
        CHECKOUT, json={"booking_id": str(uuid.uuid4())}, headers=client_headers
    )

    assert response.status_code == 404
    assert response.json()["code"] == "BOOKING_NOT_FOUND"


@pytest.mark.parametrize(
    "status,payment",
    [
        (BookingStatus.CONFIRMED, PaymentStatus.HELD),
        (BookingStatus.CANCELLED, PaymentStatus.UNPAID),
        (BookingStatus.PENDING, PaymentStatus.PAID),
    ],
)
async def test_checkout_wrong_state(
    client, client_user, client_headers, psychologist, make_booking, status,
    payment,
):
    booking = await make_booking(
        client_user, psychologist, status=status, payment_status=payment
    )

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_CANNOT_BE_PAID"


async def test_checkout_hold_missing(
    client, client_user, client_headers, psychologist, make_booking, db_session
):
    booking = await make_booking(client_user, psychologist)
    booking.hold_expires_at = None
    await db_session.commit()

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_HOLD_MISSING"


async def test_checkout_hold_expired(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(
        client_user, psychologist,
        hold_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 409
    assert response.json()["code"] == "BOOKING_HOLD_EXPIRED"


@pytest.mark.parametrize(
    "left,allowed",
    [
        (timedelta(minutes=1, seconds=59), False),
        (timedelta(minutes=2), False),
        (timedelta(minutes=2, seconds=1), True),
    ],
)
async def test_checkout_hold_expiring_soon_boundary(
    client, client_user, client_headers, psychologist, make_booking, left,
    allowed,
):
    now = datetime.now(timezone.utc)
    booking = await make_booking(
        client_user, psychologist, hold_expires_at=now + left
    )

    with freeze_time(now):
        response = await client.post(
            CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
        )

    if allowed:
        assert response.status_code == 200
    else:
        assert response.status_code == 409
        assert response.json()["code"] == "BOOKING_HOLD_EXPIRING_SOON"


async def test_checkout_provider_error(
    client, client_user, client_headers, psychologist, make_booking,
    fake_payment, reload,
):
    fake_payment.checkout_error = PaymentProviderError("down")
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 502
    assert response.json()["code"] == "PAYMENT_PROVIDER_ERROR"
    assert len(fake_payment.checkout_calls) == 1
    await reload(booking)
    assert booking.payment_provider is None
    assert booking.provider_session_id is None


async def test_checkout_save_failed(
    client, client_user, client_headers, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(
            CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
        )

    assert response.status_code == 500
    assert response.json()["code"] == "PAYMENT_SESSION_SAVE_FAILED"


async def test_checkout_provider_not_configured(
    client, client_user, client_headers, psychologist, make_booking, settings
):
    from main import app

    settings.WAYFORPAY_SECRET_KEY = ""
    app.dependency_overrides.pop(get_payment_provider)
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        CHECKOUT, json={"booking_id": str(booking.id)}, headers=client_headers
    )

    assert response.status_code == 503
    assert response.json()["code"] == "PAYMENT_PROVIDER_UNAVAILABLE"


@pytest.mark.parametrize(
    "body", [{}, {"booking_id": "abc"}, {"booking_id": str(uuid.uuid4()), "language": "xx"}]
)
async def test_checkout_validation(client, client_headers, body):
    response = await client.post(CHECKOUT, json=body, headers=client_headers)

    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


async def test_checkout_unauthorized(client):
    response = await client.post(CHECKOUT, json={"booking_id": str(uuid.uuid4())})

    assert response.status_code == 401
    assert response.json()["code"] == "NOT_AUTHENTICATED"


async def test_webhook_provider_not_active(client):
    response = await client.post("/api/payments/webhook/stripe", json={})

    assert response.status_code == 404
    assert response.json()["code"] == "WEBHOOK_PROVIDER_NOT_ACTIVE"


async def test_webhook_unknown_provider_name(client):
    response = await client.post("/api/payments/webhook/nope", json={})

    assert response.status_code == 422


async def test_webhook_invalid_webhook(client, fake_payment, fetch):
    fake_payment.next_webhook = None

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_WEBHOOK"
    assert await fetch(select(PaymentEvent)) == []


async def test_webhook_approved_marks_paid(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Approved")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    assert response.json()["status"] == "accept"
    assert response.json()["orderReference"] == f"{booking.id}_1"
    await reload(booking)
    assert booking.status == BookingStatus.CONFIRMED
    assert booking.payment_status == PaymentStatus.HELD
    assert booking.payment_provider == PaymentProviderName.WAYFORPAY
    assert booking.provider_session_id == f"{booking.id}_1"
    assert booking.payment_reference == f"{booking.id}_1"
    assert booking.paid_at is not None
    events = await fetch(select(PaymentEvent))
    assert len(events) == 1
    assert events[0].event_id == f"{booking.id}_1:Approved"
    assert events[0].booking_id == booking.id


async def test_webhook_duplicate_is_idempotent(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Approved")

    first = await client.post(WEBHOOK, json={})
    await reload(booking)
    paid_at = booking.paid_at
    second = await client.post(WEBHOOK, json={})

    assert first.status_code == second.status_code == 200
    assert second.json()["status"] == "accept"
    assert len(await fetch(select(PaymentEvent))) == 1
    await reload(booking)
    assert booking.paid_at == paid_at
    assert booking.payment_status == PaymentStatus.HELD


async def test_webhook_approved_with_wrong_amount_is_not_applied(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Approved", amount="999.00")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    assert len(await fetch(select(PaymentEvent))) == 1
    await reload(booking)
    assert booking.status == BookingStatus.PENDING
    assert booking.payment_status == PaymentStatus.UNPAID


async def test_webhook_approved_after_hold_expired(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(
        client_user, psychologist,
        hold_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    )
    fake_payment.next_webhook = make_webhook(booking, "Approved")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED
    assert booking.payment_status == PaymentStatus.UNPAID
    assert len(await fetch(select(PaymentEvent))) == 1


async def test_webhook_approved_for_cancelled_booking(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload,
):
    booking = await make_booking(
        client_user, psychologist, status=BookingStatus.CANCELLED
    )
    fake_payment.next_webhook = make_webhook(booking, "Approved")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED
    assert booking.payment_status == PaymentStatus.UNPAID


async def test_webhook_declined_keeps_booking_pending(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Declined")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    assert len(await fetch(select(PaymentEvent))) == 1
    await reload(booking)
    assert booking.status == BookingStatus.PENDING


async def test_webhook_expired_cancels_booking_and_frees_slot(
    client, client_user, other_client, psychologist, make_booking, make_webhook,
    fake_payment, reload, auth_headers, slot,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Expired")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED
    again = await client.post(
        "/api/bookings",
        json={
            "psychologist_id": str(psychologist.psychologist_id),
            "selected_time": slot(2, 10).isoformat(),
        },
        headers=auth_headers(other_client),
    )
    assert again.status_code == 201


@pytest.mark.parametrize("status", ["Refunded", "Voided"])
async def test_webhook_refund_cancels_paid_booking(
    client, client_user, psychologist, make_paid_booking, make_webhook,
    fake_payment, reload, status,
):
    booking = await make_paid_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, status)

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED
    assert booking.payment_status == PaymentStatus.REFUNDED


async def test_webhook_refund_closes_dispute(
    client, client_user, psychologist, make_paid_booking, make_webhook,
    fake_payment, reload,
):
    booking = await make_paid_booking(
        client_user, psychologist, status=BookingStatus.DISPUTED,
        refund_error=True,
    )
    fake_payment.next_webhook = make_webhook(booking, "Refunded")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    await reload(booking)
    assert booking.status == BookingStatus.CANCELLED
    assert booking.payment_status == PaymentStatus.REFUNDED
    assert booking.refund_error is False


async def test_webhook_unknown_status_is_ignored(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload, fetch,
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "InProcessing")

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    assert response.json()["status"] == "accept"
    assert await fetch(select(PaymentEvent)) == []
    await reload(booking)
    assert booking.status == BookingStatus.PENDING


async def test_webhook_unknown_booking_is_recorded(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    fetch,
):
    booking = await make_booking(client_user, psychologist)
    stranger = make_webhook(booking, "Approved").model_copy(
        update={
            "booking_id": uuid.uuid4(),
            "event_id": "zzz_1:Approved",
            "provider_session_id": "zzz_1",
            "payment_reference": "zzz_1",
        }
    )
    fake_payment.next_webhook = stranger

    response = await client.post(WEBHOOK, json={})

    assert response.status_code == 200
    events = await fetch(select(PaymentEvent))
    assert len(events) == 1
    assert events[0].booking_id is None


async def test_webhook_finds_booking_by_provider_session_id(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment,
    reload,
):
    booking = await make_booking(
        client_user, psychologist, provider_session_id="custom-session",
        payment_provider=PaymentProviderName.WAYFORPAY,
    )
    fake_payment.next_webhook = make_webhook(booking, "Approved").model_copy(
        update={
            "booking_id": uuid.uuid4(),
            "event_id": "custom-session:Approved",
            "provider_session_id": "custom-session",
            "payment_reference": "custom-session",
        }
    )

    await client.post(WEBHOOK, json={})

    await reload(booking)
    assert booking.payment_status == PaymentStatus.HELD


async def test_webhook_db_error(
    client, client_user, psychologist, make_booking, make_webhook, fake_payment
):
    booking = await make_booking(client_user, psychologist)
    fake_payment.next_webhook = make_webhook(booking, "Approved")

    with patch.object(
        AsyncSession, "commit", new=AsyncMock(side_effect=SQLAlchemyError("x"))
    ):
        response = await client.post(WEBHOOK, json={})

    assert response.status_code == 500
    assert response.json()["code"] == "PAYMENT_EVENT_SAVE_FAILED"


async def test_real_wayforpay_webhook_signed_ok(
    client, client_user, psychologist, make_booking, use_real_wayforpay,
    signed_wayforpay_payload, settings, reload,
):
    use_real_wayforpay()
    booking = await make_booking(client_user, psychologist)
    payload = signed_wayforpay_payload(f"{booking.id}_1", "Approved", "1000.00")

    response = await client.post(WEBHOOK, json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "accept"
    assert body["orderReference"] == f"{booking.id}_1"
    assert body["signature"] == calculate_signature(
        values=[body["orderReference"], "accept", body["time"]],
        secret_key=settings.WAYFORPAY_SECRET_KEY,
    )
    await reload(booking)
    assert booking.payment_status == PaymentStatus.HELD


async def test_real_wayforpay_webhook_bad_signature(
    client, client_user, psychologist, make_booking, use_real_wayforpay,
    signed_wayforpay_payload, reload, fetch,
):
    use_real_wayforpay()
    booking = await make_booking(client_user, psychologist)
    payload = signed_wayforpay_payload(f"{booking.id}_1", "Approved", "1000.00")
    payload["merchantSignature"] = "0" * 32

    response = await client.post(WEBHOOK, json=payload)

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_WEBHOOK"
    assert await fetch(select(PaymentEvent)) == []
    await reload(booking)
    assert booking.status == BookingStatus.PENDING


async def test_real_wayforpay_webhook_tampered_amount(
    client, client_user, psychologist, make_booking, use_real_wayforpay,
    signed_wayforpay_payload,
):
    use_real_wayforpay()
    booking = await make_booking(client_user, psychologist)
    payload = signed_wayforpay_payload(f"{booking.id}_1", "Approved", "1000.00")
    payload["amount"] = "1.00"

    response = await client.post(WEBHOOK, json=payload)

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_WEBHOOK"


@pytest.mark.parametrize(
    "mutate",
    [
        lambda p: p.update(merchantAccount="other_merchant"),
        lambda p: p.pop("orderReference"),
    ],
)
async def test_real_wayforpay_webhook_invalid_payload(
    client, use_real_wayforpay, signed_wayforpay_payload, mutate
):
    use_real_wayforpay()
    payload = signed_wayforpay_payload(f"{uuid.uuid4()}_1")
    mutate(payload)

    response = await client.post(WEBHOOK, json=payload)

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_WEBHOOK"


@pytest.mark.parametrize("content", [b"not json", b"[1, 2]"])
async def test_real_wayforpay_webhook_not_a_json_object(
    client, use_real_wayforpay, content
):
    use_real_wayforpay()

    response = await client.post(WEBHOOK, content=content)

    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_WEBHOOK"


def query_of(response):
    return parse_qs(urlparse(response.headers["location"]).query)


async def test_return_approved_redirects_to_success(
    client, client_user, psychologist, make_booking, settings
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        RETURN,
        data={"transactionStatus": "Approved", "orderReference": f"{booking.id}_1"},
    )

    assert response.status_code == 303
    assert response.headers["location"] == (
        f"{settings.SUCCESS_PAYMENTS_REDIRECT}?booking_id={booking.id}"
    )


async def test_return_reason_code_1100_is_success(
    client, client_user, psychologist, make_booking, settings
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        RETURN, data={"reasonCode": "1100", "orderReference": f"{booking.id}_1"}
    )

    assert response.status_code == 303
    assert response.headers["location"].startswith(settings.SUCCESS_PAYMENTS_REDIRECT)
    assert query_of(response)["booking_id"] == [str(booking.id)]


async def test_return_approved_without_order_reference(client, settings):
    response = await client.post(RETURN, data={"transactionStatus": "Approved"})

    assert response.status_code == 303
    assert response.headers["location"] == settings.SUCCESS_PAYMENTS_REDIRECT


async def test_return_cancel_when_booking_can_still_be_paid(
    client, client_user, psychologist, make_booking, settings
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        RETURN, data={"reasonCode": "1125", "orderReference": f"{booking.id}_1"}
    )

    assert response.status_code == 303
    assert response.headers["location"].startswith(
        settings.CANCEL_PAYMENTS_REDIRECT + "?"
    )
    query = query_of(response)
    assert query["lang"] == ["uk"]
    assert query["booking_id"] == [str(booking.id)]
    assert "reason" not in query


async def test_return_cancel_when_hold_is_about_to_expire(
    client, client_user, psychologist, make_booking
):
    booking = await make_booking(
        client_user, psychologist,
        hold_expires_at=datetime.now(timezone.utc) + timedelta(seconds=90),
    )

    response = await client.post(
        RETURN, data={"reasonCode": "1125", "orderReference": f"{booking.id}_1"}
    )

    assert query_of(response)["reason"] == ["expired"]


@pytest.mark.parametrize(
    "status,payment",
    [
        (BookingStatus.CANCELLED, PaymentStatus.UNPAID),
        (BookingStatus.CONFIRMED, PaymentStatus.HELD),
    ],
)
async def test_return_cancel_when_booking_is_not_payable(
    client, client_user, psychologist, make_booking, status, payment
):
    booking = await make_booking(
        client_user, psychologist, status=status, payment_status=payment,
        hold_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )

    response = await client.post(
        RETURN, data={"reasonCode": "1125", "orderReference": f"{booking.id}_1"}
    )

    assert query_of(response)["reason"] == ["expired"]


async def test_return_cancel_unknown_booking(client):
    response = await client.post(
        RETURN, data={"reasonCode": "1125", "orderReference": f"{uuid.uuid4()}_1"}
    )

    query = query_of(response)
    assert query["reason"] == ["expired"]
    assert "booking_id" not in query


async def test_return_cancel_invalid_uuid(client):
    response = await client.post(
        RETURN, data={"reasonCode": "1125", "orderReference": "abc_1"}
    )

    assert response.status_code == 303
    assert query_of(response)["reason"] == ["expired"]


async def test_return_cancel_without_order_reference(client, settings):
    response = await client.post(RETURN, data={"reasonCode": "1125"})

    assert response.status_code == 303
    assert response.headers["location"] == (
        f"{settings.NO_ORDER_REFERENCE_REDIRECT}?lang=uk"
    )


async def test_return_cancel_keeps_language(
    client, client_user, psychologist, make_booking
):
    booking = await make_booking(client_user, psychologist)

    response = await client.post(
        RETURN + "?lang=en",
        data={"reasonCode": "1125", "orderReference": f"{booking.id}_1"},
    )

    assert query_of(response)["lang"] == ["en"]


async def test_return_unknown_reason_code_returns_null_body(client):
    response = await client.post(
        RETURN, data={"reasonCode": "1101", "orderReference": f"{uuid.uuid4()}_1"}
    )

    assert response.status_code == 200
    assert response.json() is None


async def test_return_get_without_form_data_returns_null_body(client):
    response = await client.get(RETURN)

    assert response.status_code == 200
    assert response.json() is None
