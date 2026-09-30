from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from schemas.psychologist import (
    Certificate,
    MockSlot,
    PsychologistDetailResponse,
    PsychologistListItem,
    Review,
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
async def get_psychologist(
        psychologist_id: UUID,
        db: Annotated[AsyncSession, Depends(get_db)],
):
    stmt = (
        select(Psychologist)
        .options(
            selectinload(Psychologist.psychologist_specializations)
        )
        .where(Psychologist.psychologist_id == psychologist_id)
    )

    response = await db.execute(stmt)
    psychologist = response.scalar_one_or_none()

    if psychologist is None:
        raise HTTPException(
            status_code=404,
            detail="Psychologist not found",
        )

    return PsychologistDetailResponse(
        psychologist_id=psychologist.psychologist_id,
        full_name=psychologist.full_name,
        specialization=[
            s.symptom_code.value
            for s in psychologist.psychologist_specializations
        ],
        experience=str(psychologist.experience_years),
        methods=psychologist.methods or [],
        bio=psychologist.bio,
        certificates=[
            Certificate(title=certificate)
            for certificate in (psychologist.certificates or [])
        ],
        reviews=[
            Review(**review)
            for review in (psychologist.reviews or [])
        ],
        meet_link=psychologist.meet_link or "",
        mock_slots=[
            MockSlot(time=slot)
            for slot in (psychologist.mock_slots or [])
        ],
    )
