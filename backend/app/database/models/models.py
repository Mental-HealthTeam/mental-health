import datetime
import uuid
from decimal import Decimal
from enum import Enum
from typing import List

from database import Base
from sqlalchemy import (
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    JSON,
    String,
    Text,
    func, Numeric,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


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


class PsychologistStatus(str, Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    PENDING_MODERATION = "pending_moderation"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    HELD = "held"
    PAID = "paid"
    REFUNDED = "refunded"


class SelectionSource(str, Enum):
    AI_RECOMMENDATION = "ai_recommendation"
    MANUAL_FILTER = "manual_filter"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
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

    psychologist: Mapped["Psychologist"] = relationship(
        "Psychologist",
        back_populates="user"
    )

    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="client"
    )


class Psychologist(Base):
    __tablename__ = "psychologists"

    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        primary_key=True
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255)
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(255),
    )
    mock_slots: Mapped[list[str] | None] = mapped_column(
        JSON,
    )
    certificates: Mapped[list[str] | None] = mapped_column(
        JSON,
    )
    bio: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )
    reviews: Mapped[list[dict] | None] = mapped_column(
        JSON
    )
    methods: Mapped[list[str] | None] = mapped_column(
        JSON
    )
    experience_years: Mapped[int] = mapped_column(
        nullable=False
    )
    meet_link: Mapped[str | None] = mapped_column(
        String(255),
    )
    price_per_hour: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    profile_status: Mapped[PsychologistStatus] = mapped_column(
        SAEnum(PsychologistStatus, name="psychologist_status"),
        nullable=False,
        default=PsychologistStatus.PENDING_MODERATION,
    )
    gender: Mapped[Gender] = mapped_column(
        SAEnum(Gender, name="gender"),
        nullable=False,
    )
    languages: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="psychologist"
    )

    psychologist_specializations: Mapped[List["PsychologistSpecialization"]] = relationship(
        "PsychologistSpecialization",
        back_populates="psychologist"
    )

    booked_slots: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="psychologist"
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

    psychologist: Mapped["Psychologist"] = relationship(
        "Psychologist",
        back_populates="psychologist_specializations"
    )


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
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
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"),
        nullable=False,
        default=PaymentStatus.HELD,
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
    selection_source: Mapped[SelectionSource] = mapped_column(
        SAEnum(SelectionSource, name="selection_source"),
        nullable=False,
        default=SelectionSource.AI_RECOMMENDATION
    )
    ai_session_id: Mapped[str] = mapped_column(
        ForeignKey("ai_session_logs.ai_session_id"),
        nullable=False,
        unique=True,
    )

    client: Mapped[User] = relationship(
        "User",
        back_populates="bookings"
    )

    psychologist: Mapped["Psychologist"] = relationship(
        "Psychologist",
        back_populates="booked_slots"
    )

    ai_session: Mapped["AI_Session"] = relationship(
        "AI_Session",
        back_populates="booking"
    )



class AI_Session(Base):
    __tablename__ = "ai_session_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    ai_session_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"),
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

    booking: Mapped["Booking"] = relationship(
        "Booking",
        back_populates="ai_session"
    )

    ai_session_symptom_codes: Mapped[List["AISessionSymptomCode"]] = relationship(
        "AISessionSymptomCode",
        back_populates="ai_session_log"
    )


class AISessionSymptomCode(Base):
    __tablename__ = "ai_session_symptom_codes"

    ai_session_log_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_session_logs.id"),
        primary_key=True,
    )
    symptom_code: Mapped["SymptomCode"] = mapped_column(
        SAEnum(SymptomCode, name="symptom_code"),
        primary_key=True,
    )

    ai_session_log: Mapped["AI_Session"] = relationship(
        "AI_Session",
        back_populates="ai_session_symptom_codes"
    )
