from typing import Annotated

from config.settings import Settings
from fastapi import Depends, status

from redis_storage.redis_storage import RedisSessionStorage
from config.settings import BaseAppSettings
from auth.token_manager import JWTAuthManager
from payment_provider.payment_interface import PaymentProviderInterface
from payment_provider.factory import build_payment_provider
from exceptions.payments import PaymentProviderError
from exceptions.base import AppError
from storage.local_storage import AvatarLocalStorage
from email_sender.contact_sender import ContactService


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
        raise AppError(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "PAYMENT_PROVIDER_UNAVAILABLE",
            "Payment provider is not available",
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


def get_local_storage(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return AvatarLocalStorage(
        max_avatar_upload_size=settings.MAX_AVATAR_UPLOAD_SIZE,
        max_avatar_size=settings.MAX_AVATAR_SIZE,
        max_avatar_pixels=settings.MAX_AVATAR_PIXELS,
        avatar_storage_dir=settings.AVATAR_STORAGE_DIR,
        avatar_storage_url=settings.AVATAR_STORAGE_URL
    )


def get_email_sender(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return ContactService(
        contact_support_email=settings.CONTACT_SUPPORT_EMAIL,
        smtp_port=settings.SMTP_PORT,
        smtp_host=settings.SMTP_HOST,
        smtp_from_email=settings.SMTP_FROM_EMAIL,
        environment=settings.ENVIRONMENT,
        smtp_use_tls=settings.SMTP_USE_TLS,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD
    )