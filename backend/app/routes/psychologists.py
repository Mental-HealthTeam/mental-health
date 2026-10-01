from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
)
from services.psychologist_service import (
    get_psychologist_by_id,
    get_psychologists,
)

router = APIRouter()


@router.get("", response_model=list[PsychologistListItem])
async def get_psychologists_list(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_psychologists(db)


@router.get(
    "/{psychologist_id}",
    response_model=PsychologistDetailResponse,
)
async def get_psychologist(
    psychologist_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    psychologist = await get_psychologist_by_id(
        db,
        psychologist_id,
    )

    if psychologist is None:
        raise HTTPException(
            status_code=404,
            detail="Psychologist not found",
        )

    return psychologist
