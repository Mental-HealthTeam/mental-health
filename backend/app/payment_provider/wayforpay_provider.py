import asyncio
import json
import logging
import uuid
from collections.abc import Mapping
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import requests

from payment_provider.payment_types import (
    PaymentEventType,
    PaymentProviderName,
    CheckoutParams,
    CheckoutResult,
    PaymentWebhook,
    WebhookAcknowledgement,
    RefundRequest,
    RefundResult,
    PayoutRequest,
    PayoutResult,
    PayoutStatus
)
from payment_provider.payment_interface import PaymentProviderInterface
from exceptions.payments import (
    PaymentProviderError,
    WebhookVerificationError
)
from payment_provider.wayforpay_signature import (
    calculate_signature,
    verify_signature
)

logger = logging.getLogger(__name__)


_WAYFORPAY_TRANSACTION_MAP = {
    "approved": PaymentEventType.PAID,
    "expired": PaymentEventType.EXPIRED,
    "declined": PaymentEventType.FAILED,
    "refunded": PaymentEventType.REFUNDED,
    "voided": PaymentEventType.REFUNDED
}


class WayForPayPaymentProvider(PaymentProviderInterface):
    def __init__(
            self,
            merchant_account: str,
            secret_key: str,
            merchant_domain: str,
            service_url: str,
            return_url: str,
            simulate_payouts: bool,
            currency: str,
            language: str,
            version: int,
            api_url: str
    ):
        self.merchant_account = merchant_account
        self.secret_key = secret_key
        self.merchant_domain = merchant_domain
        self.service_url = service_url
        self.return_url = return_url
        self.simulate_payouts = simulate_payouts
        self.currency = currency
        self.language = language
        self.version = version
        self.api_url = api_url

    @property
    def name(self) -> PaymentProviderName:
        return PaymentProviderName.WAYFORPAY

    @staticmethod
    def _format_amount(amount: Decimal) -> str:
        return format(
            amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
            "f"
        )

    async def _post(self, payload: dict) -> dict:
        try:
            response = await asyncio.to_thread(
                requests.post,
                url=self.api_url,
                json=payload,
                timeout=15
            )
        except requests.RequestException as e:
            raise PaymentProviderError("WayForPay request failed") from e
        if response.status_code != 200:
            raise PaymentProviderError(f"WayForPay returned HTTP {response.status_code}")
        try:
            response = response.json()
            if not isinstance(response, dict):
                raise ValueError
        except ValueError as e:
            raise PaymentProviderError("WayForPay returned an invalid response") from e

        return response

    @staticmethod
    def _ensure_ok(response: dict):
        try:
            reason_code = int(response["reasonCode"])
        except (ValueError, KeyError, TypeError) as e:
            raise PaymentProviderError("WayForPay response has an invalid reasonCode") from e
        if reason_code in (1100, 4100):
            return
        if reason_code == 1112:
            raise PaymentProviderError("WayForPay rejected a duplicate orderReference (1112)")
        if reason_code == 1113:
            raise PaymentProviderError("WayForPay rejected the request signature (1113)")
        if reason_code == 1115:
            raise PaymentProviderError("WayForPay request is missing a required field (1115)")
        if reason_code == 1117:
            raise PaymentProviderError("WayForPay operation is not enabled for this merchant (1117)")
        if reason_code == 1123:
            raise PaymentProviderError("WayForPay refund cannot be performed (1123)")
        if reason_code == 1126:
            raise PaymentProviderError("WayForPay operation is not allowed in the current payment state (1126)")
        if reason_code == 1127:
            raise PaymentProviderError("WayForPay transaction not found (1127)")
        if reason_code == 1136:
            raise PaymentProviderError("WayForPay merchant balance is too low (1136)")
        if reason_code == 1139:
            raise PaymentProviderError("WayForPay rejected the transfer to the recipient (1139)")
        if reason_code == 1140:
            raise PaymentProviderError("WayForPay recipient limit exceeded (1140)")
        raise PaymentProviderError(f"WayForPay error {reason_code}: {response.get('reason')}")

    async def create_checkout_session(
            self,
            params: CheckoutParams,
    ) -> CheckoutResult:
        now = datetime.now(timezone.utc)
        time_left = params.hold_expires_at - now
        order_time = int(now.timestamp())
        order_reference = f"{params.booking_id}_{order_time}"
        amount = self._format_amount(params.amount)

        product_name = [params.description]
        product_count = [1]
        product_price = [amount]

        signature_list = [
            self.merchant_account,
            self.merchant_domain,
            order_reference,
            order_time,
            amount,
            self.currency,
            *product_name,
            *product_count,
            *product_price
        ]

        signature = calculate_signature(
            values=signature_list,
            secret_key=self.secret_key
        )

        request_params = {
            "transactionType": "CREATE_INVOICE",
            "merchantAccount": self.merchant_account,
            "merchantDomainName": self.merchant_domain,
            "merchantAuthType": "SimpleSignature",
            "merchantSignature": signature,
            "apiVersion": self.version,
            "language": self.language,
            "serviceUrl": self.service_url,
            "returnUrl": self.return_url,
            "orderReference": order_reference,
            "orderDate": order_time,
            "amount": amount,
            "currency": self.currency,
            "orderTimeout": int(time_left.total_seconds()),
            "productName": product_name,
            "productPrice": product_price,
            "productCount": product_count,
        }

        response = await self._post(payload=request_params)
        self._ensure_ok(response=response)

        invoice_url = response.get("invoiceUrl")

        if not invoice_url:
            raise PaymentProviderError("WayForPay response has no invoiceUrl")

        return CheckoutResult(
            session_id=order_reference,
            checkout_url=invoice_url
        )

    def verify_webhook_event(
        self,
        payload: bytes,
        headers: Mapping[str, str]
    ) -> PaymentWebhook:
        try:
            payload = json.loads(payload)
            if not isinstance(payload, dict):
                raise ValueError()
        except ValueError as e:
            raise WebhookVerificationError() from e

        if payload.get("merchantAccount") != self.merchant_account:
            raise WebhookVerificationError()

        signature_list = [
            payload.get("merchantAccount"),
            payload.get("orderReference"),
            payload.get("amount"),
            payload.get("currency"),
            payload.get("authCode"),
            payload.get("cardPan"),
            payload.get("transactionStatus"),
            payload.get("reasonCode"),
        ]

        if not verify_signature(
            values=signature_list,
            secret_key=self.secret_key,
            received_signature=payload.get("merchantSignature")
        ):
            raise WebhookVerificationError()

        try:
            transaction_status = str(payload.get("transactionStatus") or "")
            order_reference = payload["orderReference"]
            if order_reference is None or order_reference == "":
                raise WebhookVerificationError()
            else:
                order_reference = str(order_reference)
        except (KeyError, TypeError) as e:
            raise WebhookVerificationError() from e
        try:
            booking_id = uuid.UUID(order_reference.rpartition("_")[0])
        except (ValueError, TypeError):
            booking_id = None
        transaction_type = _WAYFORPAY_TRANSACTION_MAP.get(
            transaction_status.lower(),
            PaymentEventType.IGNORED
        )

        ignored = PaymentWebhook(
            event_id=f"{order_reference}:{transaction_status}",
            event_type=PaymentEventType.IGNORED,
            payment_reference=order_reference,
            provider_session_id=order_reference,
            metadata={},
            booking_id=None
        )
        if transaction_type is PaymentEventType.IGNORED:
            return ignored

        reason_code = payload.get("reasonCode", "")
        reason_code = "" if reason_code is None else str(reason_code)
        amount = payload.get("amount", "")
        amount = "" if amount is None else str(amount)
        currency = payload.get("currency", "")
        currency = "" if currency is None else str(currency)
        metadata = {
            "reason_code": reason_code,
            "amount": amount,
            "currency": currency
        }

        return PaymentWebhook(
            event_id=f"{order_reference}:{transaction_status}",
            event_type=transaction_type,
            provider_session_id=order_reference,
            payment_reference=order_reference,
            booking_id=booking_id,
            metadata=metadata
        )

    def build_webhook_response(
            self,
            event: PaymentWebhook
    ) -> WebhookAcknowledgement:
        now = int(datetime.now(timezone.utc).timestamp())
        provider_session_id = event.provider_session_id
        if not provider_session_id:
            raise PaymentProviderError("Cannot build WayForPay reply without orderReference")
        signature_list = [
            provider_session_id,
            "accept",
            now
        ]
        signature = calculate_signature(
            values=signature_list,
            secret_key=self.secret_key
        )
        body = {
            "orderReference": provider_session_id,
            "status": "accept",
            "time": now,
            "signature": signature
        }
        return WebhookAcknowledgement(
            status_code=200,
            body=body
        )

    async def refund(
            self,
            request: RefundRequest
    ) -> RefundResult:
        order_reference = request.payment_reference
        if not order_reference:
            raise PaymentProviderError("Refund requires a payment reference")
        if not request.amount:
            raise PaymentProviderError("WayForPay refund requires an amount")
        amount = self._format_amount(request.amount)

        signature_list = [
            self.merchant_account,
            order_reference,
            amount,
            self.currency
        ]
        signature = calculate_signature(
            values=signature_list,
            secret_key=self.secret_key
        )
        request_refund_params = {
            "transactionType": "REFUND",
            "merchantAccount": self.merchant_account,
            "merchantAuthType": "SimpleSignature",
            "merchantSignature": signature,
            "apiVersion": self.version,
            "orderReference": order_reference,
            "amount": amount,
            "currency": self.currency,
            "comment": request.reason if request.reason else "Booking cancelled"
        }

        response = await self._post(payload=request_refund_params)
        self._ensure_ok(response=response)
        success_refund_statuses = ("refunded", "voided", "refundinprocessing")

        status = str(response.get("transactionStatus") or "").lower()
        if status not in success_refund_statuses:
            raise PaymentProviderError(f"WayForPay refund was declined: {status}")

        return RefundResult(refund_id=order_reference)

    async def payout(
            self,
            request: PayoutRequest
    ) -> PayoutResult:
        if not request.currency or request.currency != self.currency:
            raise PaymentProviderError("WayForPay payouts support only UAH")

        if self.simulate_payouts:
            logger.info(
                "WayForPay payout simulated (reference=%s, amount=%s)",
                request.reference,
                request.amount
            )
            return PayoutResult(
                payout_reference=request.reference,
                status=PayoutStatus.SIMULATED
            )
        amount = self._format_amount(request.amount)
        iban = request.recipient.iban
        tax_id = request.recipient.tax_id
        account_name = request.recipient.account_name

        signature_list = [
            self.merchant_account,
            request.reference,
            amount,
            self.currency,
            iban,
            tax_id,
            account_name
        ]

        signature = calculate_signature(
            values=signature_list,
            secret_key=self.secret_key
        )

        request_payout_params = {
            "transactionType": "P2P_ACCOUNT",
            "merchantAccount": self.merchant_account,
            "merchantAuthType": "SimpleSignature",
            "merchantSignature": signature,
            "apiVersion": self.version,
            "orderReference": request.reference,
            "amount": amount,
            "currency": request.currency,
            "iban": iban,
            "okpo": tax_id,
            "accountName": account_name,
            "description": request.description if request.description else "Monthly payout",
        }
        response = await self._post(payload=request_payout_params,)
        self._ensure_ok(response=response)
        transaction_status = str(response.get("transactionStatus") or "").lower()
        if transaction_status == "approved":
            status = PayoutStatus.PAID
        elif transaction_status in ("inprocessing", "pending"):
            status = PayoutStatus.PENDING
        else:
            raise PaymentProviderError(f"WayForPay payout was declined: {transaction_status}")

        return PayoutResult(
            payout_reference=request.reference,
            status=status
        )
