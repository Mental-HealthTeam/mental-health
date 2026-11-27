import json
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

import pytest
import requests

from config.settings import TestSettings
from exceptions.payments import PaymentProviderError, WebhookVerificationError
from payment_provider.factory import build_payment_provider, clear_provider_cache
from payment_provider.payment_types import (
    CheckoutParams,
    PaymentEventType,
    PaymentProviderName,
    PaymentWebhook,
    PayoutRequest,
    PayoutStatus,
    Recipient,
    RefundRequest,
)
from payment_provider.wayforpay_provider import WayForPayPaymentProvider
from payment_provider.wayforpay_signature import calculate_signature

MERCHANT = "test_merchant"
SECRET = "test_secret"


class FakeResponse:
    def __init__(self, data=None, status_code=200, invalid_json=False):
        self._data = data
        self.status_code = status_code
        self._invalid = invalid_json

    def json(self):
        if self._invalid:
            raise ValueError("no json")
        return self._data


def make_provider(simulate=True):
    return WayForPayPaymentProvider(
        merchant_account=MERCHANT,
        secret_key=SECRET,
        merchant_domain="test.local",
        service_url="http://localhost/hook",
        return_url="http://localhost/return",
        simulate_payouts=simulate,
        currency="UAH",
        language="UA",
        version=1,
        api_url="https://api.test",
    )


def signed_payload(reference, status="Approved", **overrides):
    payload = {
        "merchantAccount": MERCHANT,
        "orderReference": reference,
        "amount": "1000.00",
        "currency": "UAH",
        "authCode": "123456",
        "cardPan": "41****1111",
        "transactionStatus": status,
        "reasonCode": "1100",
    }
    payload.update(overrides)
    values = [payload.get(key) for key in (
        "merchantAccount", "orderReference", "amount", "currency", "authCode",
        "cardPan", "transactionStatus", "reasonCode",
    )]
    payload["merchantSignature"] = calculate_signature(values, SECRET)
    return payload


def verify(provider, payload):
    return provider.verify_webhook_event(json.dumps(payload).encode(), {})


def test_name_is_wayforpay():
    assert make_provider().name == PaymentProviderName.WAYFORPAY


def test_verify_webhook_approved():
    booking_id = uuid.uuid4()

    event = verify(make_provider(), signed_payload(f"{booking_id}_17"))

    assert event.event_type == PaymentEventType.PAID
    assert event.event_id == f"{booking_id}_17:Approved"
    assert event.booking_id == booking_id
    assert event.provider_session_id == f"{booking_id}_17"
    assert event.payment_reference == f"{booking_id}_17"
    assert event.metadata == {
        "reason_code": "1100", "amount": "1000.00", "currency": "UAH",
    }


@pytest.mark.parametrize(
    "status,expected",
    [
        ("Approved", PaymentEventType.PAID),
        ("approved", PaymentEventType.PAID),
        ("Expired", PaymentEventType.EXPIRED),
        ("DECLINED", PaymentEventType.FAILED),
        ("Refunded", PaymentEventType.REFUNDED),
        ("Voided", PaymentEventType.REFUNDED),
        ("InProcessing", PaymentEventType.IGNORED),
        ("Pending", PaymentEventType.IGNORED),
    ],
)
def test_verify_webhook_status_mapping(status, expected):
    event = verify(make_provider(), signed_payload(f"{uuid.uuid4()}_1", status))

    assert event.event_type == expected


def test_verify_webhook_reference_without_booking_uuid():
    event = verify(make_provider(), signed_payload("abc"))

    assert event.booking_id is None


@pytest.mark.parametrize(
    "mutate",
    [
        lambda p: p.update(merchantAccount="other"),
        lambda p: p.update(merchantSignature="0" * 32),
        lambda p: p.update(amount="1.00"),
        lambda p: p.update(orderReference=""),
        lambda p: p.pop("merchantSignature"),
    ],
)
def test_verify_webhook_rejects_invalid_payload(mutate):
    payload = signed_payload(f"{uuid.uuid4()}_1")
    mutate(payload)

    with pytest.raises(WebhookVerificationError):
        verify(make_provider(), payload)


@pytest.mark.parametrize("body", [b"not json", b"[1, 2, 3]", b"123"])
def test_verify_webhook_rejects_non_object_body(body):
    with pytest.raises(WebhookVerificationError):
        make_provider().verify_webhook_event(body, {})


def test_build_webhook_response_is_signed():
    event = PaymentWebhook(
        event_id="e", event_type=PaymentEventType.PAID, metadata={},
        provider_session_id="ref_1",
    )

    response = make_provider().build_webhook_response(event)

    assert response.status_code == 200
    body = response.body
    assert body["orderReference"] == "ref_1"
    assert body["status"] == "accept"
    assert body["signature"] == calculate_signature(
        ["ref_1", "accept", body["time"]], SECRET
    )


def test_build_webhook_response_requires_order_reference():
    event = PaymentWebhook(
        event_id="e", event_type=PaymentEventType.PAID, metadata={}
    )

    with pytest.raises(PaymentProviderError):
        make_provider().build_webhook_response(event)


def checkout_params(language="uk"):
    return CheckoutParams(
        booking_id=uuid.uuid4(),
        amount=Decimal("1000"),
        currency="UAH",
        description="Consultation",
        hold_expires_at=datetime.now(timezone.utc) + timedelta(minutes=20),
        language=language,
    )


async def test_create_checkout_session_success():
    params = checkout_params(language="en")
    reply = FakeResponse({"reasonCode": 1100, "invoiceUrl": "https://pay.url/x"})

    with patch("requests.post", return_value=reply) as post:
        result = await make_provider().create_checkout_session(params)

    assert result.checkout_url == "https://pay.url/x"
    assert result.session_id.startswith(f"{params.booking_id}_")
    sent = post.call_args.kwargs["json"]
    assert sent["transactionType"] == "CREATE_INVOICE"
    assert sent["amount"] == "1000.00"
    assert sent["language"] == "EN"
    assert sent["returnUrl"] == "http://localhost/return?lang=en"
    assert sent["orderReference"] == result.session_id
    assert 0 < sent["orderTimeout"] <= 20 * 60


async def test_create_checkout_session_signature():
    params = checkout_params()
    reply = FakeResponse({"reasonCode": 1100, "invoiceUrl": "https://pay.url/x"})

    with patch("requests.post", return_value=reply) as post:
        await make_provider().create_checkout_session(params)

    sent = post.call_args.kwargs["json"]
    expected = calculate_signature(
        [MERCHANT, "test.local", sent["orderReference"], sent["orderDate"],
         "1000.00", "UAH", "Consultation", 1, "1000.00"],
        SECRET,
    )
    assert sent["merchantSignature"] == expected


async def test_create_checkout_session_without_invoice_url():
    with patch("requests.post", return_value=FakeResponse({"reasonCode": 1100})):
        with pytest.raises(PaymentProviderError):
            await make_provider().create_checkout_session(checkout_params())


@pytest.mark.parametrize(
    "reason_code", [1112, 1113, 1115, 1117, 1123, 1126, 1127, 1136, 1139, 1140, 9999],
)
async def test_provider_error_reason_codes(reason_code):
    reply = FakeResponse({"reasonCode": reason_code, "reason": "bad"})

    with patch("requests.post", return_value=reply):
        with pytest.raises(PaymentProviderError) as error:
            await make_provider().create_checkout_session(checkout_params())

    assert str(reason_code) in str(error.value)


@pytest.mark.parametrize(
    "reply",
    [
        FakeResponse({}, status_code=500),
        FakeResponse(invalid_json=True),
        FakeResponse([1, 2]),
        FakeResponse({"reasonCode": "abc"}),
        FakeResponse({}),
    ],
)
async def test_provider_rejects_bad_http_replies(reply):
    with patch("requests.post", return_value=reply):
        with pytest.raises(PaymentProviderError):
            await make_provider().create_checkout_session(checkout_params())


async def test_provider_request_exception_becomes_provider_error():
    with patch("requests.post", side_effect=requests.ConnectionError("down")):
        with pytest.raises(PaymentProviderError):
            await make_provider().create_checkout_session(checkout_params())


@pytest.mark.parametrize(
    "status", ["Refunded", "Voided", "RefundInProcessing"]
)
async def test_refund_success_statuses(status):
    reply = FakeResponse({"reasonCode": 1100, "transactionStatus": status})
    request = RefundRequest(payment_reference="ref_1", amount=Decimal("500"))

    with patch("requests.post", return_value=reply) as post:
        result = await make_provider().refund(request)

    assert result.refund_id == "ref_1"
    sent = post.call_args.kwargs["json"]
    assert sent["transactionType"] == "REFUND"
    assert sent["amount"] == "500.00"
    assert sent["comment"] == "Booking cancelled"


async def test_refund_declined():
    reply = FakeResponse({"reasonCode": 1100, "transactionStatus": "Declined"})
    request = RefundRequest(payment_reference="ref_1", amount=Decimal("500"))

    with patch("requests.post", return_value=reply):
        with pytest.raises(PaymentProviderError):
            await make_provider().refund(request)


async def test_refund_requires_reference_and_amount():
    provider = make_provider()
    no_reference = RefundRequest(payment_reference="", amount=Decimal("1"))
    no_amount = RefundRequest(payment_reference="ref_1")

    with pytest.raises(PaymentProviderError):
        await provider.refund(no_reference)
    with pytest.raises(PaymentProviderError):
        await provider.refund(no_amount)


def payout_request(make_iban, currency="UAH"):
    return PayoutRequest(
        reference="payout_1", amount=Decimal("800"), currency=currency,
        recipient=Recipient(
            iban=make_iban(1), tax_id="12345678", account_name="Test"
        ),
    )


async def test_payout_simulation_does_not_call_the_api(make_iban):
    with patch("requests.post") as post:
        result = await make_provider(simulate=True).payout(payout_request(make_iban))

    assert result.status == PayoutStatus.SIMULATED
    post.assert_not_called()


async def test_payout_rejects_non_uah(make_iban):
    with pytest.raises(PaymentProviderError):
        await make_provider().payout(payout_request(make_iban, currency="USD"))


@pytest.mark.parametrize(
    "status,expected",
    [
        ("Approved", PayoutStatus.PAID),
        ("InProcessing", PayoutStatus.PENDING),
        ("Pending", PayoutStatus.PENDING),
    ],
)
async def test_real_payout_statuses(make_iban, status, expected):
    reply = FakeResponse({"reasonCode": 1100, "transactionStatus": status})

    with patch("requests.post", return_value=reply) as post:
        result = await make_provider(simulate=False).payout(payout_request(make_iban))

    assert result.status == expected
    sent = post.call_args.kwargs["json"]
    assert sent["transactionType"] == "P2P_ACCOUNT"
    assert sent["okpo"] == "12345678"
    assert sent["amount"] == "800.00"


async def test_real_payout_declined(make_iban):
    reply = FakeResponse({"reasonCode": 1100, "transactionStatus": "Declined"})

    with patch("requests.post", return_value=reply):
        with pytest.raises(PaymentProviderError):
            await make_provider(simulate=False).payout(payout_request(make_iban))


def test_factory_builds_and_caches_wayforpay():
    clear_provider_cache()
    settings = TestSettings()

    first = build_payment_provider(PaymentProviderName.WAYFORPAY, settings)
    second = build_payment_provider(PaymentProviderName.WAYFORPAY, settings)

    assert isinstance(first, WayForPayPaymentProvider)
    assert first is second
    clear_provider_cache()


@pytest.mark.parametrize(
    "missing",
    ["WAYFORPAY_MERCHANT_ACCOUNT", "WAYFORPAY_SECRET_KEY",
     "WAYFORPAY_MERCHANT_DOMAIN", "PUBLIC_BASE_URL"],
)
def test_factory_reports_missing_wayforpay_setting(missing):
    clear_provider_cache()
    settings = TestSettings(**{missing: ""})

    with pytest.raises(PaymentProviderError) as error:
        build_payment_provider(PaymentProviderName.WAYFORPAY, settings)

    assert missing in str(error.value)
    clear_provider_cache()


@pytest.mark.parametrize(
    "overrides",
    [{}, {"STRIPE_SECRET_KEY": "sk"}, {"STRIPE_WEBHOOK_SECRET": "wh"}],
)
def test_factory_stripe_requires_both_keys(overrides):
    clear_provider_cache()
    settings = TestSettings(**overrides)

    with pytest.raises(PaymentProviderError):
        build_payment_provider(PaymentProviderName.STRIPE, settings)
    clear_provider_cache()


def test_factory_unknown_provider():
    clear_provider_cache()
    unknown = type("UnknownProvider", (), {"value": "nope"})()

    with pytest.raises(PaymentProviderError):
        build_payment_provider(unknown, TestSettings())
