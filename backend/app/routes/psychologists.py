from typing import Annotated
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends

from database import get_db
from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
)
from sqlalchemy.ext.asyncio import AsyncSession
from services.psychologists import (
    get_psychologists,
    get_psychologist_by_id_service
)

router = APIRouter()


@router.get(
    "",
    response_model=list[PsychologistListItem],
    summary="Get all psychologists",
    response_description="Catalog of psychologists with specializations and available slots",
)
async def list_psychologists(
        db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Returns the full psychologist catalog for the listing/catalog page.

    Note: does not filter by `profile_status` — add that filter in
    `services/psychologists.py` before exposing this publicly, so
    `pending_moderation`/`frozen` profiles don't show up.
    """
    return await get_psychologists(
        db=db
    )


@router.get(
    "/{psychologist_id}",
    response_model=PsychologistDetailResponse,
    summary="Get a single psychologist's full profile",
    response_description="Full profile with bio, certificates, reviews and available slots",
    responses={
        404: {
            "description": "Psychologist not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Psychologist not found"}
                }
            },
        },
    },
)
async def get_psychologist_by_id(
        psychologist_id: UUID,
        db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Returns the full profile for a single psychologist, used on the
    psychologist detail page (bio, certificates, reviews, meet_link).

    Raises 404 if no psychologist exists with the given id.
    """
    return await get_psychologist_by_id_service(
        psychologist_id=psychologist_id,
        db=db
    )
