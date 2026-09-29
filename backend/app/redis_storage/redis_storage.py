import json
from uuid import UUID
from datetime import datetime, timezone
from typing import Literal
from fastapi import HTTPException, status

from redis import asyncio as redis
from redis_storage.redis_interface import SessionStorageInterface


class RedisSessionStorage(SessionStorageInterface):

    def __init__(self, redis_url: str):
        self.REDIS_URL = redis_url

    def _get_redis_client(self):
        return redis.from_url(self.REDIS_URL, decode_responses=True)

    async def get_recording_info(self, session_id: str) -> dict:
        response = {}
        r = self._get_redis_client()
        meta_key = f"chat:session:{session_id}:meta"
        meta_info = await r.hgetall(meta_key)
        if not meta_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id!r} not found!"
            )

        response["created_at"] = meta_info["created_at"]
        response["message_count"] = meta_info["message_count"]

        return response



