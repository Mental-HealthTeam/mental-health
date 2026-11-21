import logging
from typing import Annotated

from fastapi import APIRouter, Depends, status

from schemas.contact import ContactRequest
from email_sender.email_sender_interface import ContactServiceInterface
from exceptions.base import AppError
from config.dependencies import get_email_sender

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/contact",
    status_code=status.HTTP_202_ACCEPTED,
)
async def submit_contact_request(
    payload: ContactRequest,
    email_sender: Annotated[ContactServiceInterface, Depends(get_email_sender)]
):
    try:
        await email_sender.send_contact_message(
            name=payload.name,
            contact=payload.contact,
            message=payload.message,
            user_id=str(payload.user_id) if payload.user_id else None,
        )
    except Exception as error:
        logger.exception("Failed to send contact request")
        raise AppError(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "CONTACT_REQUEST_FAILED",
            "Unable to send contact request.",
        ) from error

    return {"detail": "Contact request accepted."}
