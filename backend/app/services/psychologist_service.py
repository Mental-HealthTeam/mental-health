import logging
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models.models import (
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    SymptomCode,
    Language
)
from schemas.psychologist import (
    Certificate,
    MockSlot,
    PsychologistBioFields,
    PsychologistDetailResponse,
    PsychologistListItem,
    PsychologistProfileResponse,
    PsychologistProfileUpdate,
    Review,
)
from services.slot_service import (
    get_unavailable_slots,
    free_slots
)
from config.settings import BaseAppSettings
from services.localization import pick
from exceptions.base import AppError


logger = logging.getLogger(__name__)


async def get_psychologists(
    db: AsyncSession,
    limit: int,
    offset: int,
    lang: Language,
    symptom_codes: list[SymptomCode] | None = None,
    price_from: Decimal | None = None,
    price_to: Decimal | None = None,
    available_on: str | None = None,
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
    if price_from is not None:
        stmt = stmt.where(Psychologist.price_per_hour >= price_from)

    if price_to is not None:
        stmt = stmt.where(Psychologist.price_per_hour <= price_to)

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

    if available_on is None:
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
    if available_on is not None:
        kyiv_tz = ZoneInfo("Europe/Kyiv")

        target_date = datetime.now(kyiv_tz).date()

        if available_on == "tomorrow":
            target_date += timedelta(days=1)

        psychologists = [
            psychologist
            for psychologist in psychologists
            if any(
                datetime.fromisoformat(slot)
                .astimezone(kyiv_tz)
                .date() == target_date
                for slot in slots[psychologist.psychologist_id]
            )
        ]

        psychologists = psychologists[offset:offset + limit]

    return [
        PsychologistListItem(
            psychologist_id=psychologist.psychologist_id,
            full_name=pick(psychologist.full_name, psychologist.full_name_eng, lang),
            avatar_url=psychologist.avatar_url,
            experience_years=psychologist.experience_years,
            price_per_hour=psychologist.price_per_hour,
            methods=pick(psychologist.methods, psychologist.methods_eng, lang) or [],
            topics=[
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
    settings: BaseAppSettings,
    psychologist_id: UUID,
    lang: Language
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
    is_verified = psychologist.profile_status == PsychologistStatus.ACTIVE
    certificates = [
        Certificate(title=certificate)
        for certificate in (psychologist.certificates or [])
    ]
    certificates_eng = [
        Certificate(title=certificate)
        for certificate in (psychologist.certificates_eng or [])
    ]

    return PsychologistDetailResponse(
        psychologist_id=psychologist.psychologist_id,
        full_name=pick(psychologist.full_name, psychologist.full_name_eng, lang),
        title=pick(psychologist.title, psychologist.title_eng, lang),
        avatar_url=psychologist.avatar_url,
        languages=psychologist.languages,
        price_per_hour=psychologist.price_per_hour,
        is_verified=is_verified,
        session_minutes=settings.SESSION_DURATION_MIN,
        topics=[
            specialization.symptom_code.value
            for specialization in psychologist.psychologist_specializations
        ],
        experience_years=psychologist.experience_years,
        methods=pick(psychologist.methods, psychologist.methods_eng, lang) or [],
        bio=pick(psychologist.bio, psychologist.bio_eng, lang),
        certificates=pick(certificates, certificates_eng, lang),
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


async def get_my_psychologist_profile(
    db: AsyncSession,
    psychologist_id: UUID,
) -> PsychologistProfileResponse | None:
    stmt = (
        select(Psychologist)
        .options(
            selectinload(Psychologist.psychologist_specializations)
        )
        .where(Psychologist.psychologist_id == psychologist_id)
    )

    result = await db.execute(stmt)
    psychologist = result.scalar_one_or_none()

    if psychologist is None:
        return None

    taken_slots = await get_unavailable_slots(
        db=db,
        psychologist_ids=[psychologist.psychologist_id],
    )
    slots = free_slots(
        mock_slots=psychologist.mock_slots,
        taken_slots=taken_slots,
        psychologist_id=psychologist.psychologist_id,
    )

    return PsychologistProfileResponse(
        psychologist_id=psychologist.psychologist_id,
        title=psychologist.title,
        title_eng=psychologist.title_eng,
        bio=psychologist.bio or {},
        bio_eng=psychologist.bio_eng or {},
        topics=[
            item.symptom_code
            for item in psychologist.psychologist_specializations
        ],
        methods=psychologist.methods or [],
        methods_eng=psychologist.methods_eng or [],
        certificates=psychologist.certificates or [],
        certificates_eng=psychologist.certificates_eng or [],
        languages=psychologist.languages or [],
        experience_years=psychologist.experience_years,
        price_per_hour=psychologist.price_per_hour,
        mock_slots=[
            MockSlot(time=slot)
            for slot in (slots or [])
        ],
    )


def _contains_cyrillic(value: str) -> bool:
    return any(
        "\u0400" <= char <= "\u04FF"
        for char in value
    )


def _apply_bio_update(psychologist: Psychologist, bio: dict | PsychologistBioFields):
    bio_dict = (
        bio.model_dump(exclude_unset=True)
        if isinstance(bio, PsychologistBioFields)
        else bio
    )

    for field, value in bio_dict.items():
        if value is None:
            continue

        if _contains_cyrillic(value):
            psychologist.bio = {
                **(psychologist.bio or {}),
                field: value,
            }
        else:
            psychologist.bio_eng = {
                **(psychologist.bio_eng or {}),
                field: value,
            }


def _split_by_language(values: list[str]):
    ukrainian_values = [value for value in values if _contains_cyrillic(value)]
    english_values = [value for value in values if not _contains_cyrillic(value)]
    return ukrainian_values, english_values


async def update_my_psychologist_profile(
    db: AsyncSession,
    psychologist_id: UUID,
    data: PsychologistProfileUpdate,
) -> PsychologistProfileResponse | None:
    try:
        stmt = (
            select(Psychologist)
            .options(selectinload(Psychologist.psychologist_specializations))
            .where(Psychologist.psychologist_id == psychologist_id)
            .with_for_update()
        )

        result = await db.execute(stmt)
        psychologist = result.scalar_one_or_none()

        if psychologist is None:
            return None

        updates = data.model_dump(exclude_unset=True)

        if "title" in updates and updates["title"] is not None:
            title = updates.pop("title")
            if _contains_cyrillic(title):
                psychologist.title = title
            else:
                psychologist.title_eng = title

        if "certificates" in updates and updates["certificates"] is not None:
            certificates = updates.pop("certificates")
            certificates_ukrainian, certificates_english = _split_by_language(certificates)
            if certificates_ukrainian:
                psychologist.certificates = certificates_ukrainian
            if certificates_english:
                psychologist.certificates_eng = certificates_english

        if "bio" in updates and updates["bio"] is not None:
            bio = updates.pop("bio")
            _apply_bio_update(
                psychologist=psychologist,
                bio=bio
            )

        if "methods" in updates and updates["methods"] is not None:
            methods = updates.pop("methods")

            ukrainian_methods, english_methods = _split_by_language(methods)

            if ukrainian_methods:
                psychologist.methods = ukrainian_methods

            if english_methods:
                psychologist.methods_eng = english_methods

        if "meet_link" in updates and updates["meet_link"] is not None:
            meet_link = updates.pop("meet_link")

            psychologist.meet_link = str(meet_link)

        topics = updates.pop("topics", None)
        for field, value in updates.items():
            setattr(psychologist, field, value)

        if topics is not None:
            psychologist.psychologist_specializations.clear()
            psychologist.psychologist_specializations.extend(
                PsychologistSpecialization(
                    psychologist_id=psychologist_id,
                    symptom_code=topic,
                )
                for topic in topics
            )

        await db.commit()

        return await get_my_psychologist_profile(
            db=db,
            psychologist_id=psychologist_id,
        )
    except IntegrityError as e:
        await db.rollback()
        logger.warning(
            "Conflict while updating psychologist profile (psychologist_id=%s)",
            psychologist_id,
        )
        raise AppError(
            status.HTTP_409_CONFLICT,
            "PSYCHOLOGIST_PROFILE_UPDATE_CONFLICT",
            "The profile was changed by a concurrent request. Please try again."
        ) from e
    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception(
            "Failed to update psychologist profile (psychologist_id=%s)",
            psychologist_id,
        )
        raise AppError(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "PSYCHOLOGIST_PROFILE_UPDATE_FAILED",
            "Could not update the psychologist profile."
        ) from e
