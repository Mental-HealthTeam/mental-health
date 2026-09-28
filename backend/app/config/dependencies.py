from typing import Annotated

from config.settings import Settings
from fastapi import Depends
from pydantic_settings import BaseSettings

from redis_storage.redis_storage import RedisSessionStorage


def get_settings():
    return Settings()


def get_redis_storage(
    settings: Annotated[BaseSettings, Depends(get_settings)]
):
    return RedisSessionStorage(
        redis_url=settings.REDIS_URL
    )
