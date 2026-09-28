from pathlib import Path
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


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


class Settings(BaseAppSettings):
    pass


class TestSettings(BaseAppSettings):
    def model_post_init(self, context: Any, /) -> None:
        object.__setattr__(self, "PATH_TO_DB", ":memory:")
        object.__setattr__(
            self,
            "PATH_TO_JSON",
            Path(self.BASE_DIR / "database" / "seed_data" / "test_data.json")
        )

