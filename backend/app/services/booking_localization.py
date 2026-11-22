from database.models.models import Booking, Language, Psychologist
from schemas.booking import BookingPsychologist, BookingResponse
from services.localization import pick
from services.session_service import set_meet_link


def build_booking_psychologist(
    psychologist: Psychologist,
    lang: Language,
) -> dict:
    specialization_codes = [
        specialization.symptom_code.value
        for specialization in psychologist.psychologist_specializations
    ]

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
        "specializations": specialization_codes,
    }


def build_booking_response(
    booking: Booking,
    lang: Language,
) -> BookingResponse:
    set_meet_link(booking)

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
        meet_link=booking.meet_link,
    )
