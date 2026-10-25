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
from services.slot_service import (
    get_unavailable_slots,
    free_slots
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
                matching_count.c.match_count.desc(),
                Psychologist.psychologist_id
            )
        )
    else:
        stmt = stmt.order_by(
            Psychologist.psychologist_id
        )

    stmt = stmt.limit(limit).offset(offset)

    response = await db.execute(stmt)
    psychologists = response.scalars().all()
    psychologist_ids = [psychologist.psychologist_id for psychologist in psychologists]
    taken_slots = await get_unavailable_slots(
        db=db,
        psychologist_ids=psychologist_ids
    )
    slots = {
        psychologist.psychologist_id: free_slots(
            mock_slots=psychologist.mock_slots,
            taken_slots=taken_slots,
            psychologist_id=psychologist.psychologist_id
        )
        for psychologist in psychologists
    }

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
                MockSlot(
                    time=slot,
                )
                for slot in (slots[psychologist.psychologist_id] or [])
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
        .where(
            Psychologist.psychologist_id == psychologist_id,
            Psychologist.profile_status == PsychologistStatus.ACTIVE,
        )
    )

    response = await db.execute(stmt)
    psychologist = response.scalar_one_or_none()

    if psychologist is None:
        return None

    psychologist_ids = [psychologist.psychologist_id]
    taken_slots = await get_unavailable_slots(
        db=db,
        psychologist_ids=psychologist_ids
    )
    slots = free_slots(
        mock_slots=psychologist.mock_slots,
        taken_slots=taken_slots,
        psychologist_id=psychologist.psychologist_id
    )

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
        mock_slots=[
            MockSlot(
                time=slot,
            )
            for slot in slots
        ],
    )
