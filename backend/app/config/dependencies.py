from typing import Annotated

from config.settings import Settings
from fastapi import Depends

from redis_storage.redis_storage import RedisSessionStorage
from config.settings import BaseAppSettings


def get_settings():
    return Settings()


def get_redis_storage(
    settings: Annotated[BaseAppSettings, Depends(get_settings)]
):
    return RedisSessionStorage(
        redis_url=settings.REDIS_URL
    )
