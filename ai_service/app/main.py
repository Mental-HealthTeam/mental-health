import logging
from datetime import datetime
import json
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from redis import RedisError

from ai_model.ai_interface import AIClientInterface
from ai_model.system_prompt import SYSTEM_PROMPT
from config.dependencies import get_groq_client, get_redis_storage
from fastapi import Depends, FastAPI, status, HTTPException
from fastapi.responses import StreamingResponse
from redis_storage.redis_interface import SessionStorageInterface
from schemas.schemas import ChatRequest


app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)

MATCH_DATA_MARKER_START = "{"
MATCH_DATA_MARKER_END = "}"


@app.get("/health")
def health():
    return {"status": "ok"}


KYIV_TZ = ZoneInfo("Europe/Kyiv")


def resolve_timezone_info(tz_name: str | None) -> ZoneInfo:
    if tz_name is None:
        return KYIV_TZ
    try:
        resolved_timezone = ZoneInfo(tz_name)
        return resolved_timezone
    except (ZoneInfoNotFoundError, ValueError):
        return KYIV_TZ


async def today_datetime(tz_name: str | None = None) -> str:
    return datetime.now(resolve_timezone_info(tz_name=tz_name)).isoformat(timespec="seconds")


async def event_generator(
    ai_client: AIClientInterface,
    redis_storage: SessionStorageInterface,
    messages_for_api: list[dict],
    session_id: str
):
    reply = ""
    match_data_started = False
    symptom_codes_str = ""
    try:
        async for chunk in ai_client.stream_reply(messages=messages_for_api):
            reply += chunk
            if not match_data_started:
                if MATCH_DATA_MARKER_START in chunk:
                    match_data_started = True
                    content_for_user = chunk.partition(MATCH_DATA_MARKER_START)[0]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_START)[1]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_START)[2]
                    if content_for_user:
                        payload = json.dumps({"content": content_for_user}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                    continue
            elif match_data_started:
                if MATCH_DATA_MARKER_END in chunk:
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_END)[0]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_END)[1]
                    try:
                        match_data = json.loads(symptom_codes_str)
                    except json.JSONDecodeError:
                        logger.warning("AI returned invalid match data: %r", symptom_codes_str)
                    else:
                        payload = json.dumps({"match_data": match_data}, ensure_ascii=False)
                        yield f"data: {payload}\n\n"
                else:
                    symptom_codes_str += chunk
                continue
            payload = json.dumps({"content": chunk}, ensure_ascii=False)
            yield f"data: {payload}\n\n"
    except RuntimeError as e:
        logger.warning("AI stream interrupted (session_id=%s): %s", session_id, e)
        error_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_payload}\n\n"
    else:
        try:
            await redis_storage.append_message(
                session_id=session_id,
                role="assistant",
                content=reply
            )
        except RedisError:
            logger.exception(
                "Failed to save assistant reply to Redis (session_id=%s, reply_length=%d)",
                session_id,
                len(reply),
            )


@app.post(
    "/chat/message",
    response_model=None,
    status_code=status.HTTP_200_OK,
    summary="Send a chat message and stream the AI's reply",
    responses={
        200: {
            "description": (
                "Server-Sent Events stream. Each event is a `data: <json>` line followed by a blank line. "
                'Event types: `{"content": str}` (a chunk of the reply for the user), '
                '`{"match_data": {...}}` (matching info; the frontend shows the search button when '
                '`ready_for_search` is true) and `{"error": str}` (the stream was interrupted).'
            ),
            "content": {
                "text/event-stream": {
                    "example": (
                        'data: {"content": "Привіт! Розкажи, будь ласка, що тебе турбує."}\n\n'
                        'data: {"match_data": {"symptom_codes": ["anxiety"], "language": ["uk"], '
                        '"preferred_gender": null, "min_price_per_hour": null, "max_price_per_hour": null, '
                        '"min_experience_years": null, "max_experience_years": null, '
                        '"min_range_suitable_time": null, "max_range_suitable_time": null, '
                        '"ready_for_search": false}}\n\n'
                    )
                }
            },
        },
        422: {
            "description": "Request body failed validation (`session_id` and `message` are required)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "type": "missing",
                                "loc": ["body", "message"],
                                "msg": "Field required",
                            }
                        ]
                    }
                }
            },
        },
        503: {
            "description": "Could not start the reply: the AI provider or the chat storage (Redis) is unavailable",
            "content": {
                "application/json": {
                    "examples": {
                        "ai_unavailable": {
                            "summary": "AI provider error or timeout",
                            "value": {"detail": "AI service temporarily unavailable"},
                        },
                        "storage_unavailable": {
                            "summary": "Redis is unavailable",
                            "value": {"detail": "Chat storage temporarily unavailable"},
                        },
                    }
                }
            },
        },
    },
)
async def send_message(
    request: ChatRequest,
    ai_client: Annotated[AIClientInterface, Depends(get_groq_client)],
    redis_storage: Annotated[SessionStorageInterface, Depends(get_redis_storage)]
) -> StreamingResponse:
    """
    Appends the user's message to the session history, sends the full
    history plus the system prompt (with the current date and time in the
    user's timezone, `tz_name`, falling back to Europe/Kyiv) to the AI
    provider, and streams the reply back as it's generated.

    The raw `{...}` matching-info block the AI emits at the end of the
    conversation is not streamed as text. It is parsed and sent as a
    separate `match_data` event.

    If the stream breaks after it has started, an `error` event is sent
    instead of an HTTP error and the partial reply is not saved to history.

    Raises 503 if the AI provider or Redis fails before the stream starts.
    """
    try:
        history = await redis_storage.get_history(session_id=request.session_id)
        history.append({"role": "user", "content": request.message})
        messages_for_api = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT.replace(
                    "{today}",
                    await today_datetime(tz_name=request.tz_name)
                )
            },
        ] + history
        await redis_storage.append_message(session_id=request.session_id, role="user", content=request.message)
        return StreamingResponse(
            event_generator(
                ai_client=ai_client,
                redis_storage=redis_storage,
                messages_for_api=messages_for_api,
                session_id=request.session_id
            ),
            media_type="text/event-stream"
        )
    except RuntimeError as e:
        logger.warning(
            "Failed to prepare AI reply (session_id=%s): %s",
            request.session_id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable"
        ) from e
    except RedisError as e:
        logger.warning(
            "Redis unavailable while preparing chat request (session_id=%s): %s",
            request.session_id,
            e,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat storage temporarily unavailable"
        ) from e
