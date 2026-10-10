class PaymentProviderError(Exception):
    def __init__(self, message: str = "Payment provider error."):
        super().__init__(message)


class WebhookVerificationError(PaymentProviderError):
    def __init__(self, message: str = "Invalid webhook signature or payload."):
        super().__init__(message)


class RefundNotSupportedError(PaymentProviderError):
    def __init__(self, message: str = "Refund is not supported by this payment provider."):
        super().__init__(message)
