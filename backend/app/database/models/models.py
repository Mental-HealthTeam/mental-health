import datetime
import uuid
from decimal import Decimal
from enum import Enum

from database.models.base import Base
from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column


class SymptomCode(str, Enum):
    ANXIETY = "anxiety"
    BURNOUT = "burnout"
    RELATIONSHIP = "relationship"
    STRESS = "stress"
    GRIEF = "grief"
    SELF_ESTEEM = "self_esteem"
    LOW_MOOD = "low_mood"
    SLEEP = "sleep"
    FAMILY = "family"
    ANGER = "anger"
    TRAUMA = "trauma"
    ADDICTION = "addiction"
    EATING = "eating"
    LONELINESS = "loneliness"
    IDENTITY = "identity"
    WORK_CAREER = "work_career"
    MOTIVATION = "motivation"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"


class UserRole(str, Enum):
    CLIENT = "client"
    PSYCHOLOGIST = "psychologist"
    ADMIN = "admin"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.CLIENT,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class Psychologist(Base):
    __tablename__ = "psychologists"

    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.user_id"),
        primary_key=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    bio: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    price_per_hour: Mapped[Decimal] = mapped_column(
        Decimal(10, 2),
        nullable=False,
    )
    profile_status: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="pending_moderation",
    )
    gender: Mapped[Gender] = mapped_column(
        SAEnum(Gender, name="gender"),
        nullable=False,
    )
    languages: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )


class PsychologistSpecialization(Base):
    __tablename__ = "psychologist_specializations"

    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("psychologists.psychologist_id"),
        primary_key=True,
    )
    symptom_code: Mapped[SymptomCode] = mapped_column(
        SAEnum(SymptomCode, name="symptom_code"),
        primary_key=True,
    )


class Bookings(Base):
    __tablename__ = "bookings"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=False,
    )
    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("psychologists.psychologist_id"),
        nullable=False,
    )
    selected_time: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"),
        nullable=False,
        default=BookingStatus.PENDING,
    )
    payment_status: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="pending",
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="UAH",
    )
    selection_source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    ai_session_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )


class AI_Session(Base):
    __tablename__ = "ai_session_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
    )
    ai_session_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.user_id"),
        nullable=True,
    )
    messages_count: Mapped[int] = mapped_column(
        nullable=False,
    )
    duration_sec: Mapped[int] = mapped_column(
        nullable=False,
    )
    recommendations_count: Mapped[int] = mapped_column(
        nullable=False,
    )


class AISessionSymptomCode(Base):
    __tablename__ = "ai_session_symptom_codes"

    log_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_session_logs.log_id"),
        primary_key=True,
    )
    symptom_code: Mapped[SymptomCode] = mapped_column(
        SAEnum(SymptomCode, name="symptom_code"),
        primary_key=True,
    )
