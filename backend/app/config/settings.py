from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppSettings(BaseSettings):
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