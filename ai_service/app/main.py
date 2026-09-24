from typing import Annotated

from ai_model.ai_interface import AIClientInterface
from config.dependencies import get_groq_client
from fastapi import Depends, FastAPI, HTTPException, status
from schemas.schemas import ChatRequest, ChatResponse

app = FastAPI()

@app.get(
    "/health"
)
def health():
    return {"status": "ok"}


@app.post(
    "/chat/message",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK
)
def send_message(
        request: ChatRequest,
        ai_client: Annotated[AIClientInterface, Depends(get_groq_client)]
    ) -> ChatResponse:
        try:
            reply = ai_client.generate_reply(
                message=request.message
            )
        except RuntimeError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(e)
            ) from e
        return ChatResponse(reply=reply)
        

