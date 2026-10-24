import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from config.dependencies import get_settings
from config.settings import Settings
from schemas.contact import ContactRequest
from services.contact_service import ContactService


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/contact",
    status_code=status.HTTP_202_ACCEPTED,
)
def submit_contact_request(
    payload: ContactRequest,
    settings: Annotated[Settings, Depends(get_settings)],
):
    try:
        ContactService(settings).send_contact_message(
            name=payload.name,
            contact=payload.contact,
            message=payload.message,
            user_id=str(payload.user_id) if payload.user_id else None,
        )
    except Exception as error:
        logger.exception("Failed to send contact request")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send contact request.",
        ) from error

    return {"detail": "Contact request accepted."}
