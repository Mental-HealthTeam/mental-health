from pathlib import Path
from typing import Any

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

    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    SUCCESS_PAYMENTS_REDIRECT: str = "http://localhost:3000/payment/success"
    CANCEL_PAYMENTS_REDIRECT: str = "http://localhost:3000/payment/cancel"
    PAYMENT_PROVIDER: PaymentProviderName = PaymentProviderName.STRIPE


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
