import json
import uuid
from pathlib import Path

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


def populate_psychologists() -> None:
    with open(SEED_FILE, encoding="utf-8") as f:
        dataset = json.load(f)

    session_local = sessionmaker(bind=sync_database_engine)

    with session_local() as session:
        existing_count = session.query(Psychologist).count()
        if existing_count > 0:
            print(f"Skipped: psychologists table already has {existing_count} rows.")
            return

        id_mapping: dict[str, uuid.UUID] = {}

        for entry in dataset:
            new_id = uuid.uuid4()
            id_mapping[entry["id"]] = new_id

            user = User(
                id=new_id,
                email=f"{entry['id']}@mock.mentalhealth.local",
                role=UserRole.PSYCHOLOGIST,
            )
            session.add(user)

            psychologist = Psychologist(
                psychologist_id=new_id,
                full_name=entry["name"],
                title=entry["title"],
                avatar_url=entry["avatar_url"],
                mock_slots=entry["mock_slots"],
                certificates=entry["certificates"],
                bio=entry["bio"],
                reviews=entry["reviews"],
                methods=entry["methods"],
                experience_years=entry["experience_years"],
                meet_link=entry["meet_link"],
                price_per_hour=entry["price_uah"],
                profile_status=PsychologistStatus.ACTIVE,
                gender=resolve_gender(entry["name"]),
                languages=entry["languages"],
            )
            session.add(psychologist)

            for tag in entry["tags_symptoms"]:
                symptom_code = TAG_TO_SYMPTOM_CODE[tag]
                session.add(
                    PsychologistSpecialization(
                        psychologist_id=new_id,
                        symptom_code=symptom_code,
                    )
                )

        session.commit()
        print(f"Populated {len(dataset)} psychologists.")
        for source_id, generated_id in id_mapping.items():
            print(f"  {source_id} -> {generated_id}")


if __name__ == "__main__":
    populate_psychologists()
