import json
from uuid import UUID
from datetime import datetime, timezone
from typing import Literal

from redis import asyncio as redis
from redis_storage.redis_interface import SessionStorageInterface


class RedisSessionStorage(SessionStorageInterface):

    def __init__(self, redis_url: str, session_ttl: int, max_messages: int):
        self.REDIS_URL = redis_url
        self.SESSION_TTL = session_ttl
        self.MAX_MESSAGES = max_messages

    def _get_redis_client(self):
        return redis.from_url(self.REDIS_URL)

    async def _create_session(
        self,
        session_id: str,
        user_id: UUID | None = None,
        chat_type: str = "assistant"
    ) -> dict:
        meta_key = f"chat:session:{session_id}:meta"
        r = self._get_redis_client()
        await r.hset(meta_key, mapping={
            "chat_type": chat_type,
            "created_at": int(datetime.now(timezone.utc).timestamp()),
            "message_count": 0
        })
        await r.expire(meta_key, self.SESSION_TTL)
        return {"session_id": session_id, "user_id": user_id}

    async def append_message(
        self,
        session_id: str,
        role: Literal["system", "user", "assistant"],
        content: str,
        user_id: UUID | None = None
    ):
        history = await self.get_history(session_id=session_id)
        if not history:
            await self._create_session(session_id=session_id)
        r = self._get_redis_client()
        msg = {"role": role, "content": content}
        history_key = f"chat:session:{session_id}:history"
        await r.rpush(history_key, json.dumps(msg))
        await r.expire(history_key, self.SESSION_TTL)

        await r.ltrim(history_key, -self.MAX_MESSAGES, -1)

        await r.hincrby(f"chat:session:{session_id}:meta", "message_count", 1)
        await r.expire(f"chat:session:{session_id}:meta", self.SESSION_TTL)

    async def get_history(self, session_id: str) -> list[dict]:
        r = self._get_redis_client()
        history_key = f"chat:session:{session_id}:history"
        raw = await r.lrange(history_key, 0, -1)
        return [json.loads(m) for m in raw]
