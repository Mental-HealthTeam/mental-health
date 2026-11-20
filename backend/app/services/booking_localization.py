from database.models.models import Booking, Language, Psychologist
from schemas.booking import BookingPsychologist, BookingResponse
from services.localization import pick


SPECIALIZATION_TRANSLATIONS = {
    Language.UKRAINIAN: {
        "anxiety": "Тривога",
        "burnout": "Вигорання",
        "relationship": "Стосунки",
        "stress": "Стрес",
        "grief": "Втрата",
        "self_esteem": "Самооцінка",
        "low_mood": "Пригнічений настрій",
        "sleep": "Сон",
        "family": "Сім'я",
        "anger": "Гнів",
        "trauma": "Травма",
        "addiction": "Залежність",
        "eating": "Порушення харчової поведінки",
        "loneliness": "Самотність",
        "identity": "Ідентичність",
        "work_career": "Робота та кар'єра",
        "motivation": "Мотивація",
    },
    Language.ENGLISH: {
        "anxiety": "Anxiety",
        "burnout": "Burnout",
        "relationship": "Relationships",
        "stress": "Stress",
        "grief": "Grief",
        "self_esteem": "Self-esteem",
        "low_mood": "Low mood",
        "sleep": "Sleep",
        "family": "Family",
        "anger": "Anger",
        "trauma": "Trauma",
        "addiction": "Addiction",
        "eating": "Eating disorders",
        "loneliness": "Loneliness",
        "identity": "Identity",
        "work_career": "Work & career",
        "motivation": "Motivation",
    },
}


def get_localized_specializations(
    psychologist: Psychologist,
    lang: Language,
) -> list[str]:
    translations = SPECIALIZATION_TRANSLATIONS[lang]

    return [
        translations.get(
            specialization.symptom_code.value,
            specialization.symptom_code.value.replace("_", " ").title(),
        )
        for specialization in psychologist.psychologist_specializations
    ]


def build_booking_psychologist(
    psychologist: Psychologist,
    lang: Language,
) -> dict:
    return {
        "psychologist_id": psychologist.psychologist_id,
        "full_name": pick(
            psychologist.full_name,
            psychologist.full_name_eng,
            lang,
        ),
        "title": pick(
            psychologist.title,
            psychologist.title_eng,
            lang,
        ),
        "experience_years": psychologist.experience_years,
        "is_verified": psychologist.is_verified,
        "avatar_url": psychologist.avatar_url,
        "specializations": get_localized_specializations(
            psychologist,
            lang,
        ),
    }


def build_booking_response(
    booking: Booking,
    lang: Language,
) -> BookingResponse:
    return BookingResponse(
        id=booking.id,
        psychologist=BookingPsychologist(
            **build_booking_psychologist(booking.psychologist, lang)
        ),
        selected_time=booking.selected_time,
        status=booking.status,
        payment_status=booking.payment_status,
        price=booking.price,
        currency=booking.currency,
        selection_source=booking.selection_source,
        ai_session_id=booking.ai_session_id,
        hold_expires_at=booking.hold_expires_at,
        meet_link=booking.psychologist.meet_link,
    )
