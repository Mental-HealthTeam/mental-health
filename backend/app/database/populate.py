import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy.orm import sessionmaker

from database.models.models import (
    Gender,
    Psychologist,
    PsychologistSpecialization,
    PsychologistStatus,
    SymptomCode,
    User,
    UserRole,
)
from database.session_postgresql import sync_database_engine

SEED_FILE = Path(__file__).parent / "seed_db" / "psychologists.json"

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

SLOT_DAYS_AHEAD = 10


def build_mock_slots(times_of_day: list[str]) -> list[str]:
    # The seed gives times of day ("18:00"); older entries may still carry a word before it.
    times = sorted({value.split()[-1] for value in times_of_day})
    today = datetime.now(KYIV_TZ).date()
    slots = []
    for offset in range(1, SLOT_DAYS_AHEAD + 1):
        day = today + timedelta(days=offset)
        for time_str in times:
            hour, minute = map(int, time_str.split(":"))
            slot_dt = datetime(
                day.year, day.month, day.day, hour, minute, tzinfo=KYIV_TZ
            )
            slots.append(slot_dt.isoformat())
    return slots


def mock_email(source_id: str) -> str:
    return f"{source_id}@example.com"


def legacy_mock_email(source_id: str) -> str:
    return f"{source_id}@mock.mentalhealth.local"


def populate_psychologists() -> None:
    with open(SEED_FILE, encoding="utf-8") as f:
        dataset = json.load(f)

    session_local = sessionmaker(bind=sync_database_engine)

    with session_local() as session:
        created = 0
        refreshed = 0

        for entry in dataset:
            mock_slots = build_mock_slots(entry["mock_slots"])

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
                existing = session.get(Psychologist, user.id)
                if existing is not None:
                    existing.mock_slots = mock_slots
                    existing.full_name = entry["name"]
                    existing.full_name_eng = entry["name_eng"]
                    existing.title = entry["title"]
                    existing.title_eng = entry["title_eng"]
                    existing.bio = entry["bio"]
                    existing.bio_eng = entry["bio_eng"]
                    existing.reviews = entry["reviews"]
                    existing.methods = entry["methods"]
                    existing.methods_eng = entry["methods_eng"]
                    existing.iban = entry["iban"]
                    existing.tax_id = entry["tax_id"]
                    existing.account_name = entry["account_name"]
                    refreshed += 1
                    continue
                new_id = user.id
            else:
                new_id = uuid.uuid4()
                session.add(
                    User(
                        id=new_id,
                        email=mock_email(entry["id"]),
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
                    avatar_url=entry["avatar_url"],
                    mock_slots=mock_slots,
                    certificates=entry["certificates"],
                    bio=entry["bio"],
                    bio_eng=entry["bio_eng"],
                    reviews=entry["reviews"],
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

        session.commit()
        print(f"Created {created} psychologists, refreshed mock_slots for {refreshed}.")


if __name__ == "__main__":
    populate_psychologists()
