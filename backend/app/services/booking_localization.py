
from collections.abc import Mapping
from typing import Any

from database.models.models import Booking, Language, Psychologist
from schemas.booking import BookingPsychologist, BookingResponse
from services.localization import pick


def get_value(source: Any, key: str, default: Any = None) -> Any:
    if isinstance(source, Mapping):
        return source.get(key, default)

    return getattr(source, key, default)


def build_booking_psychologist(
    psychologist: Psychologist | dict,
    lang: Language,
) -> dict:
    full_name = get_value(psychologist, "full_name")
    full_name_eng = get_value(psychologist, "full_name_eng")

    title = get_value(psychologist, "title")
    title_eng = get_value(psychologist, "title_eng")

    # Compatibility with dictionary-based test mocks.
    if full_name is None:
        full_name = get_value(psychologist, "display_full_name")

    if title is None:
        title = get_value(psychologist, "display_title")

    specializations = get_value(
        psychologist,
        "psychologist_specializations",
    )

    if specializations is None:
        specializations = get_value(psychologist, "specializations", [])

    specialization_codes = []

    for specialization in specializations:
        if isinstance(specialization, str):
            specialization_codes.append(specialization)
            continue

        symptom_code = get_value(specialization, "symptom_code")

        if symptom_code is not None:
            specialization_codes.append(
                get_value(symptom_code, "value", symptom_code)
            )

    return {
        "psychologist_id": get_value(psychologist, "psychologist_id"),
        "full_name": pick(full_name, full_name_eng, lang),
        "title": pick(title, title_eng, lang),
        "experience_years": get_value(psychologist, "experience_years"),
        "is_verified": get_value(psychologist, "is_verified"),
        "avatar_url": get_value(psychologist, "avatar_url"),
        "specializations": specialization_codes,
    }


def build_booking_response(
    booking: Booking | dict,
    lang: Language,
) -> BookingResponse:
    psychologist = get_value(booking, "psychologist")

    return BookingResponse(
        id=get_value(booking, "id"),
        psychologist=BookingPsychologist(
            **build_booking_psychologist(psychologist, lang)
        ),
        selected_time=get_value(booking, "selected_time"),
        status=get_value(booking, "status"),
        payment_status=get_value(booking, "payment_status"),
        price=get_value(booking, "price"),
        currency=get_value(booking, "currency"),
        selection_source=get_value(booking, "selection_source"),
        ai_session_id=get_value(booking, "ai_session_id"),
        hold_expires_at=get_value(booking, "hold_expires_at"),
        meet_link=get_value(booking, "meet_link"),
    )
