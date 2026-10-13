from typing import Annotated

from config.settings import Settings
from fastapi import Depends, HTTPException, status

from redis_storage.redis_storage import RedisSessionStorage
from config.settings import BaseAppSettings
from auth.token_manager import JWTAuthManager
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.factory import build_payment_provider
from exceptions.payments import PaymentProviderError


def get_settings():
    return Settings()


def get_redis_storage(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return RedisSessionStorage(redis_url=settings.REDIS_URL)


def get_payment_provider(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
) -> PaymentProviderInterface:
    try:
        return build_payment_provider(
            name=settings.PAYMENT_PROVIDER,
            settings=settings
        )
    except PaymentProviderError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment provider is not available"
        ) from error


def get_jwt_manager(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return JWTAuthManager(
        secret_key_access=settings.SECRET_KEY_ACCESS,
        secret_key_refresh=settings.SECRET_KEY_REFRESH,
        algorithm=settings.JWT_SIGNING_ALGORITHM,
        access_key_timedelta_minutes=settings.ACCESS_TTL_MIN,
        refresh_key_timedelta_minutes=settings.refresh_ttl_min
    )
