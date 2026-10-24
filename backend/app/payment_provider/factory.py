from config.settings import BaseAppSettings
from payment_provider.payment_interface import PaymentProviderInterface
from exceptions.payments import PaymentProviderError
from payment_provider.payment_types import PaymentProviderName

_providers = {}


def clear_provider_cache():
    _providers.clear()


def _build_stripe(
        settings: BaseAppSettings
) -> PaymentProviderInterface:
    from payment_provider.stripe_provider import StripePaymentProvider
    if not settings.STRIPE_SECRET_KEY:
        raise PaymentProviderError(
            "Stripe is not configured: STRIPE_SECRET_KEY"
        )
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise PaymentProviderError(
            "Stripe is not configured: STRIPE_WEBHOOK_SECRET"
        )
    return StripePaymentProvider(
        api_key=settings.STRIPE_SECRET_KEY,
        webhook_secret=settings.STRIPE_WEBHOOK_SECRET,
        success_url=settings.SUCCESS_PAYMENTS_REDIRECT,
        cancel_url=settings.CANCEL_PAYMENTS_REDIRECT
    )


def _build_wayforpay(
    settings: BaseAppSettings
) -> PaymentProviderInterface:
    from payment_provider.wayforpay_provider import WayForPayPaymentProvider
    if not settings.WAYFORPAY_MERCHANT_ACCOUNT:
        raise PaymentProviderError(
            "WayForPay is not configured: WAYFORPAY_MERCHANT_ACCOUNT"
        )
    if not settings.WAYFORPAY_SECRET_KEY:
        raise PaymentProviderError(
            "WayForPay is not configured: WAYFORPAY_SECRET_KEY"
        )
    if not settings.WAYFORPAY_MERCHANT_DOMAIN:
        raise PaymentProviderError(
            "WayForPay is not configured: WAYFORPAY_MERCHANT_DOMAIN"
        )
    if not settings.PUBLIC_BASE_URL:
        raise PaymentProviderError(
            "WayForPay is not configured: PUBLIC_BASE_URL"
        )
    return WayForPayPaymentProvider(
        merchant_account=settings.WAYFORPAY_MERCHANT_ACCOUNT,
        secret_key=settings.WAYFORPAY_SECRET_KEY,
        merchant_domain=settings.WAYFORPAY_MERCHANT_DOMAIN,
        service_url=settings.PUBLIC_BASE_URL.rstrip("/") + settings.WAYFORPAY_SERVICE_URL_PART,
        return_url=settings.SUCCESS_PAYMENTS_REDIRECT,
        simulate_payouts=settings.WAYFORPAY_SIMULATE_PAYOUTS,
        currency=settings.WAYFORPAY_CURRENCY,
        language=settings.WAYFORPAY_LANGUAGE,
        version=settings.WAYFORPAY_VERSION,
        api_url=settings.WAYFORPAY_API_ADDRESS
    )


_BUILDERS = {
    PaymentProviderName.STRIPE: _build_stripe,
    PaymentProviderName.WAYFORPAY: _build_wayforpay
}


def build_payment_provider(
        name: PaymentProviderName,
        settings: BaseAppSettings
) -> PaymentProviderInterface:
    if name in _BUILDERS:
        if name in _providers:
            return _providers[name]
        provider = _BUILDERS[name](settings=settings)
        _providers[name] = provider
        return provider
    raise PaymentProviderError(
        f"Payment provider {name.value!r} is not available."
    )
