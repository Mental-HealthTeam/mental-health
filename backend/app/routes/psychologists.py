from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from database.models.models import Psychologist

router = APIRouter()


@router.get("", response_model=list[PsychologistListItem])
async def get_psychologists(
        db: Annotated[AsyncSession, Depends(get_db)]
):
    stmt = select(Psychologist)
    response = await db.execute(stmt)
    psychologist = response.all()




@router.get("/{psychologist_id}", response_model=PsychologistDetailResponse)
def get_psychologist(psychologist_id: UUID):
    raise HTTPException(
        status_code=404,
        detail="Psychologist not found",
    )
