import datetime
import uuid

from db import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, String, Text, Numeric, DateTime, Boolean, Integer


class User(Base):
    __tablename__ = 'users'

    user_id : Mapped[uuid.UUID] = mapped_column(primary_key=True)
    email : Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    role : Mapped[str] = mapped_column(nullable=False)
    created_at : Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now())


class Psychologist(Base):
    __tablename__ = 'psychologists'

    psychologist_id : Mapped[uuid.UUID] = mapped_column(ForeignKey('users.user_id'), primary_key=True)
    full_name : Mapped[str] = mapped_column(String(100), nullable=False)
    bio : Mapped[str] = mapped_column(Text, nullable=False)
    price_per_hour : Mapped[float] = mapped_column(Numeric(10,2), nullable=False)
    profile_status : Mapped[str] = mapped_column(String(100), nullable=False, default='pending_moderation')

class SlotsBase(Base):
    __tablename__ = 'slots'

    slot_id : Mapped[uuid.UUID] = mapped_column(primary_key=True)
    psychologist_id : Mapped[uuid.UUID] = mapped_column(ForeignKey('psychologists.psychologist_id'), primary_key=True)
    start_time : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time : Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_booked : Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

class Bookings(Base):
    __tablename__ = 'bookings'

    booking_id : Mapped[uuid.UUID] = mapped_column(primary_key=True)
    client_id : Mapped[uuid.UUID] = mapped_column(ForeignKey('users.user_id'), primary_key=True)
    psychologist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('psychologists.psychologist_id'), primary_key=True)
    slot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('slots.slot_id'), primary_key=True)
    status: Mapped[str] = mapped_column(String(100), nullable=False, default='pending')
    payment_status: Mapped[str] = mapped_column(String(100), nullable=False, default='pending')
    price: Mapped[float] = mapped_column(Numeric(10,2), nullable=False)
    currency: Mapped[str] = mapped_column(String(100), nullable=False, default='UAH')
    selection_source: Mapped[str] = mapped_column(String(100), nullable=False)
    ai_session_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

class AI_Session(Base):
    __tablename__ = 'ai_sessions'

    log_id : Mapped[uuid.UUID] = mapped_column(primary_key=True)
    ai_session_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    user_id : Mapped[uuid.UUID] = mapped_column(ForeignKey('users.user_id'), primary_key=True)
    messages_count : Mapped[int] = mapped_column(Integer, nullable=False)
    duration_sec : Mapped[int] = mapped_column(Integer, nullable=False)
    recommendation_count : Mapped[int] = mapped_column(Integer, nullable=False)
    concern_category : Mapped[str] = mapped_column(String(100), nullable=False, default='anxiety')

