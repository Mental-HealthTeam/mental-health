import json
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session, sessionmaker

from config.dependencies import get_settings
from database.models.models import (
    Booking,
    BookingStatus,
    Gender,
    PaymentStatus,
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    Review,
    SelectionSource,
    SymptomCode,
    User,
    UserRole,
    UserSymptomCode,
)
from database.session_postgresql import sync_database_engine

SEED_FILE = Path(__file__).parent / "seed_db" / "psychologists.json"
CLIENTS_SEED_FILE = Path(__file__).parent / "seed_db" / "clients.json"

ACTIVE_SLOT_STATUSES = (
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.DISPUTED,
    BookingStatus.COMPLETED,
)

TAG_TO_SYMPTOM_CODE = {
    "Тривожність": SymptomCode.ANXIETY,
    "Вигорання": SymptomCode.BURNOUT,
    "Стосунки": SymptomCode.RELATIONSHIP,
    "Стрес": SymptomCode.STRESS,
    "Горе та втрата": SymptomCode.GRIEF,
    "Самооцінка": SymptomCode.SELF_ESTEEM,
    "Пригніченість": SymptomCode.LOW_MOOD,
    "Порушення сну": SymptomCode.SLEEP,
    "Сім'я та батьківство": SymptomCode.FAMILY,
    "Гнів та агресія": SymptomCode.ANGER,
    "Травма": SymptomCode.TRAUMA,
    "Залежна поведінка": SymptomCode.ADDICTION,
    "Харчова поведінка": SymptomCode.EATING,
    "Самотність": SymptomCode.LONELINESS,
    "Пошук себе": SymptomCode.IDENTITY,
    "Кар'єра": SymptomCode.WORK_CAREER,
    "Мотивація": SymptomCode.MOTIVATION,
}

GENDER_BY_FIRST_NAME = {
    "Євген": Gender.MALE,
    "Ігор": Gender.MALE,
    "Андрій": Gender.MALE,
    "Артем": Gender.MALE,
    "Богдан": Gender.MALE,
    "Вадим": Gender.MALE,
    "Володимир": Gender.MALE,
    "Віталій": Gender.MALE,
    "Денис": Gender.MALE,
    "Дмитро": Gender.MALE,
    "Максим": Gender.MALE,
    "Назар": Gender.MALE,
    "Олег": Gender.MALE,
    "Олександр": Gender.MALE,
    "Павло": Gender.MALE,
    "Роман": Gender.MALE,
    "Сергій": Gender.MALE,
    "Станіслав": Gender.MALE,
    "Тарас": Gender.MALE,
    "Ярослав": Gender.MALE,
    "Євгенія": Gender.FEMALE,
    "Інна": Gender.FEMALE,
    "Ірина": Gender.FEMALE,
    "Аліна": Gender.FEMALE,
    "Анна": Gender.FEMALE,
    "Вікторія": Gender.FEMALE,
    "Віра": Gender.FEMALE,
    "Катерина": Gender.FEMALE,
    "Людмила": Gender.FEMALE,
    "Лілія": Gender.FEMALE,
    "Марина": Gender.FEMALE,
    "Марія": Gender.FEMALE,
    "Надія": Gender.FEMALE,
    "Наталія": Gender.FEMALE,
    "Оксана": Gender.FEMALE,
    "Олександра": Gender.FEMALE,
    "Олена": Gender.FEMALE,
    "Ольга": Gender.FEMALE,
    "Світлана": Gender.FEMALE,
    "Тетяна": Gender.FEMALE,
    "Христина": Gender.FEMALE,
    "Юлія": Gender.FEMALE,
}


def resolve_gender(full_name: str) -> Gender:
    first_name = full_name.split()[0]
    return GENDER_BY_FIRST_NAME[first_name]


KYIV_TZ = ZoneInfo("Europe/Kyiv")

SLOT_WEEKS_AHEAD = 3


def build_mock_slots(base_slots: dict[str, list[str]]) -> list[str]:
    # base_slots maps ISO weekday ("1" = Monday ... "7" = Sunday) to hours ("18:00").
    now = datetime.now(KYIV_TZ)
    today = now.date()
    slots = []
    for offset in range(SLOT_WEEKS_AHEAD * 7):
        day = today + timedelta(days=offset)
        for time_str in sorted(set(base_slots.get(str(day.isoweekday()), []))):
            hour, minute = map(int, time_str.split(":"))
            slot_dt = datetime(
                day.year, day.month, day.day, hour, minute, tzinfo=KYIV_TZ
            )
            if slot_dt > now:
                slots.append(slot_dt.isoformat())
    return slots


def mock_email(source_id: str) -> str:
    return f"{source_id}@example.com"


def legacy_mock_email(source_id: str) -> str:
    return f"{source_id}@mock.mentalhealth.local"


def seed_booking_id(source_id: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"seed-booking:{source_id}")


def populate_clients(session: Session) -> dict[str, uuid.UUID]:
    with open(CLIENTS_SEED_FILE, encoding="utf-8") as f:
        dataset = json.load(f)

    client_ids = {}

    for entry in dataset:
        email = mock_email(entry["id"])
        user = session.query(User).filter_by(email=email).first()

        if user is None:
            user = User(id=uuid.uuid4(), email=email, role=UserRole.CLIENT)
            session.add(user)

        user.name = entry["name"]
        user.avatar_url = user.avatar_url or entry["avatar_url"]
        user.telegram = entry["telegram"]
        user.allow_notifications = entry["allow_notifications"]

        saved_codes = {item.symptom_code for item in user.user_symptom_codes}
        user.user_symptom_codes.extend(
            UserSymptomCode(symptom_code=SymptomCode(code))
            for code in entry["topics"]
            if SymptomCode(code) not in saved_codes
        )
        client_ids[entry["id"]] = user.id

    session.flush()
    return client_ids


def build_seed_booking(
    item: dict,
    psychologist_id: uuid.UUID,
    client_id: uuid.UUID,
    price: Decimal,
    now: datetime,
) -> Booking:
    # day_offset is counted from the seed run date: negative is the past.
    day = now.date() + timedelta(days=item["day_offset"])
    hour, minute = map(int, item["time"].split(":"))
    selected_time = datetime(
        day.year, day.month, day.day, hour, minute, tzinfo=KYIV_TZ
    )
    status = BookingStatus(item["status"])
    payment_status = PaymentStatus(item["payment_status"])

    booking = Booking(
        id=seed_booking_id(item["id"]),
        client_id=client_id,
        psychologist_id=psychologist_id,
        selected_time=selected_time,
        status=status,
        payment_status=payment_status,
        price=price,
        currency="UAH",
        selection_source=SelectionSource(item["selection_source"]),
        saved=item["saved"],
    )

    if payment_status != PaymentStatus.UNPAID:
        booking.paid_at = min(selected_time, now) - timedelta(days=1)

    if payment_status in (PaymentStatus.HELD, PaymentStatus.PAID):
        # A filled reference keeps seed bookings out of the monthly payout.
        booking.payout_reference = f"seed-{item['id']}"

    if status == BookingStatus.COMPLETED:
        booking.completed_at = selected_time + timedelta(
            minutes=get_settings().SESSION_DURATION_MIN
        )

    if payment_status == PaymentStatus.PAID:
        fee_percent = Decimal(str(get_settings().PLATFORM_FEE_PERCENT))
        booking.platform_fee = (price * fee_percent / 100).quantize(Decimal("0.01"))
        booking.payout_amount = price - booking.platform_fee
        booking.released_at = booking.completed_at

    return booking


def populate_bookings(
    session: Session,
    dataset: list[dict],
    psychologist_ids: dict[str, uuid.UUID],
    client_ids: dict[str, uuid.UUID],
) -> None:
    """Create missing seed bookings and reviews; existing rows are not changed."""
    now = datetime.now(KYIV_TZ)
    bookings_created = 0
    bookings_skipped = 0
    reviews_created = 0

    for entry in dataset:
        psychologist_id = psychologist_ids[entry["id"]]

        for item in entry["bookings"]:
            booking = session.get(Booking, seed_booking_id(item["id"]))

            if booking is None:
                booking = build_seed_booking(
                    item=item,
                    psychologist_id=psychologist_id,
                    client_id=client_ids[item["client_id"]],
                    price=Decimal(str(entry["price_uah"])),
                    now=now,
                )
                slot_taken = booking.status in ACTIVE_SLOT_STATUSES and (
                    session.query(Booking.id)
                    .filter(
                        Booking.psychologist_id == psychologist_id,
                        Booking.selected_time == booking.selected_time,
                        Booking.status.in_(ACTIVE_SLOT_STATUSES),
                    )
                    .first()
                    is not None
                )
                if slot_taken:
                    bookings_skipped += 1
                    continue
                session.add(booking)
                bookings_created += 1

            review = item["review"]

            if (
                review is None
                or booking.status != BookingStatus.COMPLETED
                or session.get(Review, booking.id) is not None
            ):
                continue

            session.add(
                Review(
                    booking_id=booking.id,
                    client_id=booking.client_id,
                    psychologist_id=booking.psychologist_id,
                    rating=review["rating"],
                    review_text=review["review_text"],
                    review_text_eng=review["review_text_eng"],
                    created_at=(booking.completed_at or booking.selected_time) + timedelta(days=1),
                )
            )
            reviews_created += 1

    print(
        f"Created {bookings_created} bookings (skipped {bookings_skipped}), "
        f"{reviews_created} reviews."
    )


def populate_psychologists() -> None:
    with open(SEED_FILE, encoding="utf-8") as f:
        dataset = json.load(f)

    session_local = sessionmaker(bind=sync_database_engine)

    with session_local() as session:
        created = 0
        refreshed = 0
        psychologist_ids = {}

        for entry in dataset:
            mock_slots = build_mock_slots(entry["base_slots"])

            email = mock_email(entry["id"])

            user = session.query(User).filter_by(email=email).first()

            if user is None:
                user = (
                    session.query(User)
                    .filter_by(email=legacy_mock_email(entry["id"]))
                    .first()
                )
                if user is not None:
                    user.email = email

            if user is not None:
                if not user.avatar_url:
                    user.avatar_url = entry["avatar_url"]
                existing = session.get(Psychologist, user.id)
                if existing is not None:
                    existing.mock_slots = mock_slots
                    existing.full_name = entry["name"]
                    existing.full_name_eng = entry["name_eng"]
                    existing.title = entry["title"]
                    existing.title_eng = entry["title_eng"]
                    existing.bio = entry["bio"]
                    existing.bio_eng = entry["bio_eng"]
                    existing.methods = entry["methods"]
                    existing.methods_eng = entry["methods_eng"]
                    existing.certificates_eng = entry["certificates_eng"]
                    existing.iban = entry["iban"]
                    existing.tax_id = entry["tax_id"]
                    existing.account_name = entry["account_name"]
                    existing.price_per_hour = entry["price_uah"]
                    existing.experience_years = entry["experience_years"]
                    existing.languages = entry["languages"]
                    session.query(PsychologistSpecialization).filter_by(
                        psychologist_id=user.id
                    ).delete()
                    for tag in entry["tags_symptoms"]:
                        session.add(
                            PsychologistSpecialization(
                                psychologist_id=user.id,
                                symptom_code=TAG_TO_SYMPTOM_CODE[tag],
                            )
                        )
                    refreshed += 1
                    psychologist_ids[entry["id"]] = user.id
                    continue
                new_id = user.id
            else:
                new_id = uuid.uuid4()
                session.add(
                    User(
                        id=new_id,
                        email=mock_email(entry["id"]),
                        avatar_url=entry["avatar_url"],
                        role=UserRole.PSYCHOLOGIST,
                    )
                )

            session.add(
                Psychologist(
                    psychologist_id=new_id,
                    full_name=entry["name"],
                    full_name_eng=entry["name_eng"],
                    title=entry["title"],
                    title_eng=entry["title_eng"],
                    mock_slots=mock_slots,
                    certificates=entry["certificates"],
                    certificates_eng=entry["certificates_eng"],
                    bio=entry["bio"],
                    bio_eng=entry["bio_eng"],
                    methods=entry["methods"],
                    methods_eng=entry["methods_eng"],
                    experience_years=entry["experience_years"],
                    meet_link=entry["meet_link"],
                    price_per_hour=entry["price_uah"],
                    profile_status=PsychologistStatus.ACTIVE,
                    gender=resolve_gender(entry["name"]),
                    languages=entry["languages"],
                    iban=entry["iban"],
                    tax_id=entry["tax_id"],
                    account_name=entry["account_name"],
                )
            )
            for tag in entry["tags_symptoms"]:
                session.add(
                    PsychologistSpecialization(
                        psychologist_id=new_id,
                        symptom_code=TAG_TO_SYMPTOM_CODE[tag],
                    )
                )
            created += 1
            psychologist_ids[entry["id"]] = new_id

        print(f"Created {created} psychologists, refreshed {refreshed}.")

        client_ids = populate_clients(session)
        populate_bookings(session, dataset, psychologist_ids, client_ids)
        session.commit()


if __name__ == "__main__":
    populate_psychologists()
