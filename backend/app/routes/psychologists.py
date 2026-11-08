from typing import Annotated, Literal
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status

from exceptions.base import AppError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from auth.dependencies import require_roles
from database import get_db
from database.models.models import (
    Psychologist,
    SymptomCode,
    User,
    UserRole,
    Language
)
from schemas.payout import PayoutDetailsFields, PayoutDetailsResponse
from schemas.psychologist import (
    PsychologistDetailResponse,
    PsychologistListItem,
    PsychologistProfileResponse,
    PsychologistProfileUpdate,
)
from services.psychologist_service import (
    get_psychologists,
    get_psychologist_by_id as get_psychologist_by_id_service,
    get_my_psychologist_profile,
    update_my_psychologist_profile,
)
from config.dependencies import get_settings
from config.settings import BaseAppSettings

router = APIRouter()


@router.get(
    "",
    response_model=list[PsychologistListItem],
    summary="Get all psychologists",
    response_description=(
        "Catalog of psychologists with topics and available slots"
    ),
)
async def list_psychologists(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=5, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    symptom_codes: list[SymptomCode] | None = Query(default=None),
    lang: Language = Query(default=Language.UKRAINIAN),
    price_from: Decimal | None = Query(default=None, ge=0),
    price_to: Decimal | None = Query(default=None, ge=0),
    available_on: Literal["today", "tomorrow"] | None = Query(default=None),
):
    """
    Returns the psychologist catalog for the listing/catalog page.
    Only active psychologist profiles are returned.
    Supports pagination and optional filtering by symptoms, price and availability.
    """
    if (
            price_from is not None
            and price_to is not None
            and price_from > price_to
    ):
        raise HTTPException(
            status_code=422,
            detail="price_from cannot be greater than price_to",
        )
    return await get_psychologists(
        db=db,
        limit=limit,
        offset=offset,
        symptom_codes=symptom_codes,
        lang=lang,
        price_from=price_from,
        price_to=price_to,
        available_on=available_on,
    )


@router.get(
    "/me/payout-details",
    response_model=PayoutDetailsResponse,
    summary="Get own psychologist payout details",
)
async def get_my_payout_details(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.PSYCHOLOGIST)),
    ],
):
    """
    Returns payout details for the authenticated psychologist.
    """
    psychologist = await db.get(Psychologist, current_user.id)

    if psychologist is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_PROFILE_NOT_FOUND",
            "Psychologist profile not found",
        )

    return PayoutDetailsResponse(
        iban=psychologist.iban,
        tax_id=psychologist.tax_id,
        account_name=psychologist.account_name,
    )


@router.put(
    "/me/payout-details",
    response_model=PayoutDetailsResponse,
    summary="Save own psychologist payout details",
)
async def update_my_payout_details(
    payout_data: PayoutDetailsFields,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.PSYCHOLOGIST)),
    ],
):
    """
    Saves payout details for the authenticated psychologist.
    """
    psychologist = await db.get(Psychologist, current_user.id)

    if psychologist is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_PROFILE_NOT_FOUND",
            "Psychologist profile not found",
        )

    iban_conflict = await db.scalar(
        select(Psychologist.psychologist_id).where(
            Psychologist.iban == payout_data.iban,
            Psychologist.psychologist_id != current_user.id,
        )
    )
    if iban_conflict is not None:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "IBAN_ALREADY_EXISTS",
            "This IBAN already belongs to another psychologist",
        )

    tax_id_conflict = await db.scalar(
        select(Psychologist.psychologist_id).where(
            Psychologist.tax_id == payout_data.tax_id,
            Psychologist.psychologist_id != current_user.id,
        )
    )
    if tax_id_conflict is not None:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "TAX_ID_ALREADY_EXISTS",
            "This tax ID already belongs to another psychologist",
        )

    psychologist.iban = payout_data.iban
    psychologist.tax_id = payout_data.tax_id
    psychologist.account_name = payout_data.account_name

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()

        constraint_name = getattr(
            getattr(exc.orig, "diag", None),
            "constraint_name",
            None,
        )

        if constraint_name == "psychologists_iban_key":
            raise AppError(
                status.HTTP_409_CONFLICT,
                "IBAN_ALREADY_EXISTS",
                "This IBAN already belongs to another psychologist",
            ) from exc

        if constraint_name == "psychologists_tax_id_key":
            raise AppError(
                status.HTTP_409_CONFLICT,
                "TAX_ID_ALREADY_EXISTS",
                "This tax ID already belongs to another psychologist",
            ) from exc

        raise AppError(
            status.HTTP_409_CONFLICT,
            "PAYOUT_DETAILS_CONFLICT",
            "Payout details conflict with existing data",
        ) from exc

    await db.refresh(psychologist)

    return PayoutDetailsResponse(
        iban=psychologist.iban,
        tax_id=psychologist.tax_id,
        account_name=psychologist.account_name,
    )


@router.get(
    "/me/profile",
    response_model=PsychologistProfileResponse,
    summary="Get own psychologist profile",
)
async def get_my_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.PSYCHOLOGIST)),
    ],
):
    profile = await get_my_psychologist_profile(
        db=db,
        psychologist_id=current_user.id,
    )

    if profile is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_PROFILE_NOT_FOUND",
            "Psychologist profile not found",
        )

    return profile


@router.patch(
    "/me/profile",
    response_model=PsychologistProfileResponse,
    summary="Update own psychologist profile",
)
async def update_my_profile(
    profile_data: PsychologistProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_roles(UserRole.PSYCHOLOGIST)),
    ],
):
    profile = await update_my_psychologist_profile(
        db=db,
        psychologist_id=current_user.id,
        data=profile_data,
    )

    if profile is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_PROFILE_NOT_FOUND",
            "Psychologist profile not found",
        )

    return profile


@router.get(
    "/{psychologist_id}",
    response_model=PsychologistDetailResponse,
    summary="Get a single psychologist's full profile",
    response_description=(
        "Full profile with title, avatar, price per hour, languages, "
        "verification status, session duration, topics, experience, bio, "
        "certificates, reviews and available slots"
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
    settings: Annotated[BaseAppSettings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
    lang: Language = Query(default=Language.UKRAINIAN)
):
    """
    Returns the full profile for a single psychologist.

    `is_verified` is true when the profile status is active.
    `session_minutes` is the session duration from the platform settings.
    Payout and meeting details are not part of the public response.
    """
    psychologist = await get_psychologist_by_id_service(
        psychologist_id=psychologist_id,
        db=db,
        lang=lang,
        settings=settings
    )

    if psychologist is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "PSYCHOLOGIST_NOT_FOUND",
            "Psychologist not found",
        )

    return psychologist
