from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from schemas.psychologist import (
    MockSlot,
    PsychologistDetailResponse,
    PsychologistListItem,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from database import get_db
from database.models.models import Psychologist

router = APIRouter()


@router.get("", response_model=list[PsychologistListItem])
async def get_psychologists(
        db: Annotated[AsyncSession, Depends(get_db)]
):
    stmt = select(Psychologist).options(
        selectinload(Psychologist.psychologist_specializations)
    )
    response = await db.execute(stmt)
    psychologists = response.scalars().all()

    return [
        PsychologistListItem(
            psychologist_id=psychologist.psychologist_id,
            full_name=psychologist.full_name,
            specialization=[
                s.symptom_code.value for s in psychologist.psychologist_specializations
            ],
            mock_slots=[
                MockSlot(time=slot) for slot in (psychologist.mock_slots or [])
            ],
        )
        for psychologist in psychologists
    ]


@router.get("/{psychologist_id}", response_model=PsychologistDetailResponse)
def get_psychologist(psychologist_id: UUID):
    raise HTTPException(
        status_code=404,
        detail="Psychologist not found",
    )
