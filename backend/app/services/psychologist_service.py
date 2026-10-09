from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.models import (
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    SymptomCode,
)
from schemas.psychologist import (
    Certificate,
    MockSlot,
    PsychologistDetailResponse,
    PsychologistListItem,
    Review,
)


async def get_psychologists(
    db: AsyncSession,
    limit: int,
    offset: int,
    symptom_codes: list[SymptomCode] | None = None,
) -> list[PsychologistListItem]:
    stmt = (
        select(Psychologist)
        .options(
            selectinload(Psychologist.psychologist_specializations)
        )
        .where(
            Psychologist.profile_status == PsychologistStatus.ACTIVE
        )
    )

    if symptom_codes:
        matching_count = (
            select(
                PsychologistSpecialization.psychologist_id,
                func.count(
                    PsychologistSpecialization.symptom_code
                ).label("match_count"),
            )
            .where(
                PsychologistSpecialization.symptom_code.in_(symptom_codes)
            )
            .group_by(
                PsychologistSpecialization.psychologist_id
            )
            .subquery()
        )

        stmt = (
            stmt
            .join(
                matching_count,
                Psychologist.psychologist_id
                == matching_count.c.psychologist_id,
            )
            .order_by(
                matching_count.c.match_count.desc()
            )
        )

    stmt = stmt.limit(limit).offset(offset)

    response = await db.execute(stmt)
    psychologists = response.scalars().all()

    return [
        PsychologistListItem(
            psychologist_id=psychologist.psychologist_id,
            full_name=psychologist.full_name,
            avatar_url=psychologist.avatar_url,
            experience_years=psychologist.experience_years,
            price_per_hour=psychologist.price_per_hour,
            methods=psychologist.methods or [],
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
