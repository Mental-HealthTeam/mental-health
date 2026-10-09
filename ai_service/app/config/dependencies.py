import logging
from typing import Annotated

from ai_model.gemini_client import GeminiClient
from ai_model.grok_client import GrokClient
from ai_model.groq_client import GroqClient
from config.settings import Settings
from fastapi import (
    Depends,
    Request,
    HTTPException,
    status
)
from config.settings import BaseAppSettings
from redis_storage.redis_storage import RedisSessionStorage


logger = logging.getLogger(__name__)


def get_settings():
    return Settings()


def get_gemini_client(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return GeminiClient(
        api_key=settings.GEMINI_API_KEY
    )


def get_grok_client(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return GrokClient(
        api_key=settings.XAI_API_KEY
    )


def get_groq_client(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return GroqClient(
        api_key=settings.GROQ_API_KEY
    )


def get_redis_storage(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return RedisSessionStorage(
        redis_url=settings.REDIS_URL,
        session_ttl=settings.SESSION_TTL,
        max_messages=settings.MAX_MESSAGES
    )


def verify_origin(
        request: Request,
        settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    origin = request.headers.get("Origin")
    if not origin:
        logger.debug("Request without Origin header (path=%s)", request.url.path)
        return
    for allowed_origin in settings.cors_origins_list:
        if origin == allowed_origin:
            return
    logger.warning("Origin rejected (origin=%s, path=%s)", origin, request.url.path)
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Origin not allowed"
    )
