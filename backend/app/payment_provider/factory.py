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
    elif not settings.STRIPE_WEBHOOK_SECRET:
        raise PaymentProviderError(
            "Stripe is not configured: STRIPE_WEBHOOK_SECRET"
        )
    return StripePaymentProvider(
        api_key=settings.STRIPE_SECRET_KEY,
        webhook_secret=settings.STRIPE_WEBHOOK_SECRET,
        success_url=settings.SUCCESS_PAYMENTS_REDIRECT,
        cancel_url=settings.CANCEL_PAYMENTS_REDIRECT
    )


_BUILDERS = {
    PaymentProviderName.STRIPE: _build_stripe
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
