from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from payment_provider.payment_types import PaymentProviderName


class BaseAppSettings(BaseSettings):
    BASE_DIR: Path = Path(__file__).parent.parent
    PATH_TO_DB: str = str(BASE_DIR / "database" / "source" / "psychologists.db")
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    PROJECT_NAME: str = "PROJECT_NAME"
    DB_USER: str = "DB_USER"
    DB_NAME: str = "DB_NAME"
    DB_PASSWORD: str = "DB_PASSWORD"
    DB_PORT: int = 5432
    DB_HOST: str = "db"
    REDIS_URL: str = "redis://redis:6379/0"

    GOOGLE_CLIENT_ID: str = "GOOGLE_CLIENT_ID"
    SECRET_KEY_ACCESS: str = "SECRET_KEY_ACCESS"
    SECRET_KEY_REFRESH: str = "SECRET_KEY_REFRESH"
    JWT_SIGNING_ALGORITHM: str = "HS256"
    COOKIE_SECURE: bool = False
    ACCESS_TTL_MIN: int = 15
    REFRESH_TTL_DAYS: int = 30
    CORS_ORIGINS: str = "http://localhost"
    ACCESS_COOKIE: str = "access"
    REFRESH_COOKIE: str = "refresh"
    ACCESS_PATH: str = "/"
    REFRESH_PATH: str = "/api/auth"

    CONTACT_SUPPORT_EMAIL: str = "support@platform.com"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    SUCCESS_PAYMENTS_REDIRECT: str = "http://localhost/payment/success"
    CANCEL_PAYMENTS_REDIRECT: str = "http://localhost/payment/cancel"
    PAYMENT_PROVIDER: PaymentProviderName = PaymentProviderName.WAYFORPAY
    BOOKING_HOLD_MINUTES: int = 20
    BOOKING_HORIZON_DAYS: int = 30
    SESSION_DURATION_MIN: int = 50

    WAYFORPAY_RETURN_URL_PART: str = "/api/payments/return/wayforpay"
    WAYFORPAY_MERCHANT_ACCOUNT: str = ""
    WAYFORPAY_SECRET_KEY: str = ""
    WAYFORPAY_MERCHANT_DOMAIN: str = ""
    WAYFORPAY_API_ADDRESS: str = "https://api.wayforpay.com/api"
    WAYFORPAY_VERSION: int = 1
    WAYFORPAY_CURRENCY: str = "UAH"
    WAYFORPAY_SIMULATE_PAYOUTS: bool = True
    WAYFORPAY_LANGUAGE: str = "UA"
    WAYFORPAY_SERVICE_URL_PART: str = "/api/payments/webhook/wayforpay"
    NO_ORDER_REFERENCE_REDIRECT: str = ""

    PUBLIC_BASE_URL: str = "http://localhost:8000"

    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_TIMEZONE: str = "Europe/Kyiv"

    PLATFORM_FEE_PERCENT: int = Field(default=35, gt=0, le=100)

    BOOKING_FREE_CANCEL_HOURS: int = 24

    MAX_AVATAR_UPLOAD_SIZE: int = 20 * 1024 * 1024
    AVATAR_STORAGE_DIR: str = "media/avatars"
    MAX_AVATAR_SIZE: int = 5 * 1024 * 1024
    MAX_AVATAR_PIXELS: int = 4096 * 4096
    AVATAR_STORAGE_URL: str = "/media/avatars/"

    ENVIRONMENT: str = "development"

    @property
    def refresh_ttl_min(self):
        return self.REFRESH_TTL_DAYS * 24 * 60

    @property
    def cors_origins_list(self):
        return [cor_origin.strip() for cor_origin in self.CORS_ORIGINS.strip().split(",")]


class Settings(BaseAppSettings):
    pass


class TestSettings(BaseAppSettings):
    __test__ = False

    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    ENVIRONMENT: str = "testing"
    PATH_TO_DB: str = ":memory:"
    PATH_TO_JSON: Path = Path(__file__).parent.parent / "database" / "seed_data" / "test_data.json"

    SECRET_KEY_ACCESS: str = "test-access-secret-key-at-least-32-bytes!!"
    SECRET_KEY_REFRESH: str = "test-refresh-secret-key-at-least-32-bytes!"
    GOOGLE_CLIENT_ID: str = "test-google-client-id"
    CORS_ORIGINS: str = "http://localhost"
    COOKIE_SECURE: bool = False

    PLATFORM_FEE_PERCENT: int = 20
    BOOKING_HOLD_MINUTES: int = 20
    BOOKING_FREE_CANCEL_HOURS: int = 24
    BOOKING_HORIZON_DAYS: int = 30
    SESSION_DURATION_MIN: int = 50

    PAYMENT_PROVIDER: PaymentProviderName = PaymentProviderName.WAYFORPAY
    WAYFORPAY_MERCHANT_ACCOUNT: str = "test_merchant"
    WAYFORPAY_SECRET_KEY: str = "test_secret"
    WAYFORPAY_MERCHANT_DOMAIN: str = "test.local"
    WAYFORPAY_SIMULATE_PAYOUTS: bool = True

    SMTP_HOST: str = ""
    SMTP_USE_TLS: bool = False

    MAX_AVATAR_UPLOAD_SIZE: int = 1024 * 1024
    MAX_AVATAR_SIZE: int = 512 * 1024
    MAX_AVATAR_PIXELS: int = 1000 * 1000
