"""add payment and booking fields

Revision ID: 8cba3eb7f816
Revises: 8d54b7c51f06
Create Date: 2026-10-12 13:08:40.363809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8cba3eb7f816'
down_revision: Union[str, Sequence[str], None] = '8d54b7c51f06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ACTIVE_SLOT_PREDICATE = "status IN ('CONFIRMED', 'PENDING', 'DISPUTED', 'COMPLETED')"


def upgrade() -> None:
    """Upgrade schema."""
    # A new enum value cannot be used in the transaction that adds it, so it is
    # committed first: the active slot index below refers to 'DISPUTED'.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'DISPUTED'")

    # The new slot index is wider than the old one, so existing rows must not
    # already break it.
    bind = op.get_bind()
    duplicated_slots = bind.execute(sa.text(
        "SELECT psychologist_id, selected_time FROM bookings "
        f"WHERE {ACTIVE_SLOT_PREDICATE} "
        "GROUP BY psychologist_id, selected_time HAVING count(*) > 1"
    )).fetchall()
    if duplicated_slots:
        raise RuntimeError(
            "Cannot create uq_booking_active_slot: some psychologist slots are "
            "booked more than once in active statuses. Resolve the duplicates first."
        )

    op.create_table('payment_events',
    sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('provider', sa.Enum('STRIPE', 'WAYFORPAY', name='paymentprovidername', native_enum=False, length=50), nullable=False),
    sa.Column('event_id', sa.String(length=255), nullable=False),
    sa.Column('booking_id', sa.Uuid(), nullable=True),
    sa.Column('event_type', sa.Enum('PAID', 'EXPIRED', 'REFUNDED', 'FAILED', 'IGNORED', name='paymenteventtype', native_enum=False, length=50), nullable=False),
    sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['booking_id'], ['bookings.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('provider', 'event_id')
    )
    op.add_column('bookings', sa.Column('payment_provider', sa.Enum('STRIPE', 'WAYFORPAY', name='paymentprovidername', native_enum=False, length=50), nullable=True))
    op.add_column('bookings', sa.Column('payment_reference', sa.String(length=255), nullable=True))
    op.add_column('bookings', sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('hold_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('payout_amount', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('bookings', sa.Column('platform_fee', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('bookings', sa.Column('payout_reference', sa.String(length=255), nullable=True))
    op.add_column('bookings', sa.Column('released_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('bookings', sa.Column('provider_session_id', sa.String(length=255), nullable=True))
    op.alter_column('bookings', 'ai_session_id',
               existing_type=sa.VARCHAR(length=50),
               nullable=True)
    op.drop_constraint(op.f('bookings_ai_session_id_key'), 'bookings', type_='unique')

    # Bookings created before payments existed were never paid.
    op.execute(
        "UPDATE bookings SET payment_status = 'UNPAID' "
        "WHERE status = 'PENDING' AND payment_status = 'HELD'"
    )

    op.drop_index(op.f('uq_booking_confirmed_slot'), table_name='bookings', postgresql_where="(status = 'CONFIRMED'::booking_status)")
    op.create_index('ix_booking_status_payment_hold', 'bookings', ['status', 'payment_status', 'hold_expires_at'], unique=False)
    op.create_index('uq_booking_active_slot', 'bookings', ['psychologist_id', 'selected_time'], unique=True, postgresql_where=sa.text(ACTIVE_SLOT_PREDICATE))
    op.create_unique_constraint('bookings_provider_session_id_key', 'bookings', ['provider_session_id'])
    op.add_column('psychologists', sa.Column('payout_card_token', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema.

    PostgreSQL cannot remove a value from an enum, so 'DISPUTED' stays in
    booking_status; bookings that use it are moved to 'COMPLETED'.
    """
    bind = op.get_bind()
    missing_ai_session = bind.execute(sa.text(
        "SELECT count(*) FROM bookings WHERE ai_session_id IS NULL"
    )).scalar()
    shared_ai_session = bind.execute(sa.text(
        "SELECT count(*) FROM ("
        "SELECT ai_session_id FROM bookings WHERE ai_session_id IS NOT NULL "
        "GROUP BY ai_session_id HAVING count(*) > 1) AS shared"
    )).scalar()
    if missing_ai_session or shared_ai_session:
        raise RuntimeError(
            "Cannot downgrade: bookings without ai_session_id or sharing one "
            "ai_session_id exist, and the old schema requires it to be unique and set."
        )

    op.execute("UPDATE bookings SET status = 'COMPLETED' WHERE status = 'DISPUTED'")

    op.drop_column('psychologists', 'payout_card_token')
    op.drop_constraint('bookings_provider_session_id_key', 'bookings', type_='unique')
    op.drop_index('uq_booking_active_slot', table_name='bookings', postgresql_where=sa.text(ACTIVE_SLOT_PREDICATE))
    op.drop_index('ix_booking_status_payment_hold', table_name='bookings')
    op.create_index(op.f('uq_booking_confirmed_slot'), 'bookings', ['psychologist_id', 'selected_time'], unique=True, postgresql_where="(status = 'CONFIRMED'::booking_status)")
    op.create_unique_constraint(op.f('bookings_ai_session_id_key'), 'bookings', ['ai_session_id'], postgresql_nulls_not_distinct=False)
    op.alter_column('bookings', 'ai_session_id',
               existing_type=sa.VARCHAR(length=50),
               nullable=False)
    op.drop_column('bookings', 'provider_session_id')
    op.drop_column('bookings', 'released_at')
    op.drop_column('bookings', 'payout_reference')
    op.drop_column('bookings', 'platform_fee')
    op.drop_column('bookings', 'payout_amount')
    op.drop_column('bookings', 'completed_at')
    op.drop_column('bookings', 'hold_expires_at')
    op.drop_column('bookings', 'paid_at')
    op.drop_column('bookings', 'payment_reference')
    op.drop_column('bookings', 'payment_provider')
    op.drop_table('payment_events')
