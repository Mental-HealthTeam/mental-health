import json
from typing import Annotated

from ai_model.ai_interface import AIClientInterface
from ai_model.system_prompt import SYSTEM_PROMPT
from config.dependencies import get_groq_client, get_redis_storage
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse
from redis_storage.redis_interface import SessionStorageInterface
from schemas.schemas import ChatRequest


app = FastAPI()

MATCH_DATA_MARKER_START = "{"
MATCH_DATA_MARKER_END = "}"


@app.get("/health")
def health():
    return {"status": "ok"}


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
            if match_data_started is False:
                if MATCH_DATA_MARKER_START in chunk:
                    match_data_started = True
                    content_for_user = chunk.partition(MATCH_DATA_MARKER_START)[0]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_START)[1]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_START)[2]
                    if content_for_user:
                        payload = json.dumps({"content": content_for_user})
                        yield f"data: {payload}\n\n"
                    continue
            elif match_data_started is True:
                if MATCH_DATA_MARKER_END in chunk:
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_END)[0]
                    symptom_codes_str += chunk.partition(MATCH_DATA_MARKER_END)[1]
                    yield f"data: {symptom_codes_str}\n\n"
                else:
                    symptom_codes_str += chunk
                continue
            payload = json.dumps({"content": chunk})
            yield f"data: {payload}\n\n"
    except RuntimeError as e:
        print(e)
        error_payload = json.dumps({"error": str(e)})
        yield f"data: {error_payload}\n\n"
    await redis_storage.append_message(session_id=session_id, role="assistant", content=reply)


@app.post(
    "/chat/message",
    response_model=None,
    status_code=status.HTTP_200_OK
)
async def send_message(
    request: ChatRequest,
    ai_client: Annotated[AIClientInterface, Depends(get_groq_client)],
    redis_storage: Annotated[SessionStorageInterface, Depends(get_redis_storage)]
) -> StreamingResponse:
    try:
        history = await redis_storage.get_history(session_id=request.session_id)
        history.append({"role": "user", "content": request.message})
        messages_for_api = [
            {"role": "system", "content": SYSTEM_PROMPT},
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
        print(e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        ) from e
