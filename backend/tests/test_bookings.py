class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    DISPUTED = "disputed"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    HELD = "held"
    PAID = "paid"
    REFUNDED = "refunded"

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        server_default=func.gen_random_uuid()
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )
    psychologist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("psychologists.psychologist_id"),
        index=True
    )
    selected_time_label: Mapped[str] = mapped_column(
        String(100),
    )
    selected_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True)
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"),
        default=BookingStatus.PENDING,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"),
        default=PaymentStatus.UNPAID,
    )
    payment_provider: Mapped[PaymentProviderName | None] = mapped_column(
        SAEnum(PaymentProviderName, native_enum=False, length=50),
        nullable=True
    )
    payment_reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    paid_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    hold_expires_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    payout_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )
    platform_fee: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )
    payout_reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    released_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    provider_session_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True
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
    ai_session_id: Mapped[str | None] = mapped_column(
        ForeignKey("ai_session_logs.ai_session_id"),
        nullable=True
    )

    __table_args__ = (
        Index(
            "uq_booking_active_slot",
            "psychologist_id", "selected_time",
            unique=True,
            postgresql_where=text(
                "status IN ('CONFIRMED', 'PENDING', 'DISPUTED', 'COMPLETED')"
            )
        ),
        Index(
            "ix_booking_status_payment_hold",
            "status", "payment_status", "hold_expires_at"
        ),