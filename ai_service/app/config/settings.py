from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    GEMINI_API_KEY: str = "your-gemini-api-key-here"
    REDIS_URL: str = "redis://redis:6379/0"
    XAI_API_KEY: str = "your-xai-api-key-here"
    GROQ_API_KEY: str = "your-groq-api-key-here"
    SESSION_TTL: int = 1800
    MAX_MESSAGES: int = 10


class Settings(BaseAppSettings):
    pass
