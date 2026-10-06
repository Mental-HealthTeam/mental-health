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
    func,
    Numeric,
    UniqueConstraint
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


class AuthProvider(str, Enum):
    GOOGLE = "google"
    PASSWORD = "password"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500)
    )
    last_login_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
    )
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"),
        default=UserRole.CLIENT,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
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

    user_identities: Mapped[List["UserIdentity"]] = relationship(
        "UserIdentity",
        back_populates="user"
    )

    auth_sessions: Mapped[List["AuthSession"]] = relationship(
        "AuthSession",
        back_populates="user"
    )


class Psychologist(Base):
    __tablename__ = "psychologists"

    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        primary_key=True
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
    )
    title: Mapped[str] = mapped_column(
        String(255)
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(255),
    )
    mock_slots: Mapped[list[dict] | None] = mapped_column(
        JSON
    )
    certificates: Mapped[list[str] | None] = mapped_column(
        JSON,
    )
    bio: Mapped[dict] = mapped_column(
        JSON,
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
    )
    profile_status: Mapped[PsychologistStatus] = mapped_column(
        SAEnum(PsychologistStatus, name="psychologist_status"),
        default=PsychologistStatus.PENDING_MODERATION,
    )
    gender: Mapped[Gender] = mapped_column(
        SAEnum(Gender, name="gender"),
    )
    languages: Mapped[list[str]] = mapped_column(
        JSON,
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
    )
    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("psychologists.psychologist_id"),
    )
    selected_time: Mapped[str] = mapped_column(
        String(100),
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"),
        default=BookingStatus.PENDING,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"),
        default=PaymentStatus.HELD,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
    )
    currency: Mapped[str] = mapped_column(
        String(100),
        default="UAH",
    )
    selection_source: Mapped[SelectionSource] = mapped_column(
        SAEnum(SelectionSource, name="selection_source"),
        default=SelectionSource.AI_RECOMMENDATION
    )
    ai_session_id: Mapped[str] = mapped_column(
        ForeignKey("ai_session_logs.ai_session_id"),
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


class AI_Session(Base):  # noqa: N801
    __tablename__ = "ai_session_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    ai_session_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    messages_count: Mapped[int]
    duration_sec: Mapped[int]
    recommendations_count: Mapped[int]

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


class UserIdentity(Base):
    __tablename__ = "user_identities"
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    provider: Mapped["AuthProvider"] = mapped_column(
        SAEnum(AuthProvider, name="auth_provider")
    )
    provider_subject: Mapped[str] = mapped_column(
        String(255)
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    __table_args__ = (UniqueConstraint("provider", "provider_subject"),)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_identities"
    )


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    family_id: Mapped[uuid.UUID] = mapped_column(
        index=True
    )
    jti: Mapped[uuid.UUID] = mapped_column(
        unique=True
    )
    expires_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True)
    )
    revoked_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    replaced_by: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    ip: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="auth_sessions"
    )
