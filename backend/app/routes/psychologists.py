from uuid import UUID

from fastapi import APIRouter, HTTPException

from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
)

router = APIRouter(
    prefix="/psychologists",
    tags=["Psychologists"],
)


@router.get("/", response_model=list[PsychologistListItem])
def get_psychologists():
    return []


@router.get("/{psychologist_id}", response_model=PsychologistDetailResponse)
def get_psychologist(psychologist_id: UUID):
    raise HTTPException(
        status_code=404,
        detail="Psychologist not found",
    )
