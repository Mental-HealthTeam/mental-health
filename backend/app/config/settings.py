from pathlib import Path
from typing import Any

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

    CONTACT_SUPPORT_EMAIL: str = "support@platform.com"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_TLS: bool = True
    APP_ENV: str = "development"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    SUCCESS_PAYMENTS_REDIRECT: str = "http://localhost:3000/payment/success"
    CANCEL_PAYMENTS_REDIRECT: str = "http://localhost:3000/payment/cancel"
    PAYMENT_PROVIDER: PaymentProviderName = PaymentProviderName.WAYFORPAY
    BOOKING_HOLD_MINUTES: int = 20
    BOOKING_HORIZON_DAYS: int = 30
    SESSION_DURATION_MIN: int = 50

    WAYFORPAY_MERCHANT_ACCOUNT: str = ""
    WAYFORPAY_SECRET_KEY: str = ""
    WAYFORPAY_MERCHANT_DOMAIN: str = ""
    WAYFORPAY_API_ADDRESS: str = "https://api.wayforpay.com/api"
    WAYFORPAY_VERSION: int = 1
    WAYFORPAY_CURRENCY: str = "UAH"
    WAYFORPAY_SIMULATE_PAYOUTS: bool = True
    WAYFORPAY_LANGUAGE: str = "UA"
    WAYFORPAY_SERVICE_URL_PART: str = "/api/payments/webhook/wayforpay"

    PUBLIC_BASE_URL: str = "http://localhost:8000"

    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_TIMEZONE: str = "Europe/Kyiv"

    PLATFORM_FEE_PERCENT: int = Field(default=35, gt=0, le=100)

    BOOKING_FREE_CANCEL_HOURS: int = 24

    @property
    def order_timeout_sec(self):
        return self.BOOKING_HOLD_MINUTES * 60


class Settings(BaseAppSettings):
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

    @property
    def refresh_ttl_min(self):
        return self.REFRESH_TTL_DAYS * 24 * 60

    @property
    def cors_origins_list(self):
        return [cor_origin.strip() for cor_origin in self.CORS_ORIGINS.strip().split(",")]


class TestSettings(BaseAppSettings):
    def model_post_init(self, context: Any, /) -> None:
        object.__setattr__(self, "PATH_TO_DB", ":memory:")
        object.__setattr__(
            self,
            "PATH_TO_JSON",
            Path(self.BASE_DIR / "database" / "seed_data" / "test_data.json")
        )
