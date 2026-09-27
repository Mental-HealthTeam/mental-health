from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    PROJECT_NAME: str = "PROJECT_NAME"
    DB_USER: str = "DB_USER"
    DB_NAME: str = "DB_NAME"
    POSTGRES_PASSWORD: str = "DB_PASSWORD"
    DB_PORT: int = 5432


class Settings(BaseAppSettings):
    pass