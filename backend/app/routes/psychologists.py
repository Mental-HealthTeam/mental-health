from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from database.models.models import SymptomCode
from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
)
from services.psychologist_service import (
    get_psychologists,
    get_psychologist_by_id as get_psychologist_by_id_service,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[PsychologistListItem],
    summary="Get all psychologists",
    response_description=(
        "Catalog of psychologists with specializations and available slots"
    ),
)
async def list_psychologists(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=5, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    symptom_codes: list[SymptomCode] | None = Query(default=None),
):
    """
    Returns the psychologist catalog for the listing/catalog page.

    Only active psychologist profiles are returned.
    Supports pagination and filtering by multiple symptom codes.
    """
    return await get_psychologists(
        db=db,
        limit=limit,
        offset=offset,
        symptom_codes=symptom_codes,
    )


@router.get(
    "/{psychologist_id}",
    response_model=PsychologistDetailResponse,
    summary="Get a single psychologist's full profile",
    response_description=(
        "Full profile with bio, certificates, reviews and available slots"
    ),
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
    Returns the full profile for a single psychologist.
    """
    return await get_psychologist_by_id_service(
        psychologist_id=psychologist_id,
        db=db,
    )
