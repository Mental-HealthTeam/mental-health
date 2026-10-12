from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.models import Psychologist
from schemas.psychologist import (
    Certificate,
    MockSlot,
    PsychologistDetailResponse,
    PsychologistListItem,
    Review,
)


async def get_psychologists(
    db: AsyncSession,
) -> list[PsychologistListItem]:
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
                specialization.symptom_code.value
                for specialization in psychologist.psychologist_specializations
            ],
            mock_slots=[
                MockSlot(time=slot)
                for slot in (psychologist.mock_slots or [])
            ],
        )
        for psychologist in psychologists
    ]


async def get_psychologist_by_id(
    db: AsyncSession,
    psychologist_id: UUID,
) -> PsychologistDetailResponse | None:
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
        return None

    return PsychologistDetailResponse(
        psychologist_id=psychologist.psychologist_id,
        full_name=psychologist.full_name,
        specialization=[
            specialization.symptom_code.value
            for specialization in psychologist.psychologist_specializations
        ],
        experience=psychologist.experience_years,
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
