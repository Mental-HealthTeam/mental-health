"""add dispute fields to bookings

Revision ID: e36e791c2538
Revises: f0b00261b10d
Create Date: 2026-10-29 14:17:54.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e36e791c2538'
down_revision: Union[str, Sequence[str], None] = 'f0b00261b10d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'bookings',
        sa.Column('disputed_by_id', sa.Uuid(), nullable=True)
    )
    op.add_column(
        'bookings',
        sa.Column('dispute_resolved_by_id', sa.Uuid(), nullable=True)
    )
    op.add_column(
        'bookings',
        sa.Column('dispute_note', sa.String(length=550), nullable=True)
    )
    op.create_foreign_key(
        'bookings_disputed_by_id_fkey',
        'bookings', 'users',
        ['disputed_by_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'bookings_dispute_resolved_by_id_fkey',
        'bookings', 'users',
        ['dispute_resolved_by_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('bookings_dispute_resolved_by_id_fkey', 'bookings', type_='foreignkey')
    op.drop_constraint('bookings_disputed_by_id_fkey', 'bookings', type_='foreignkey')
    op.drop_column('bookings', 'dispute_note')
    op.drop_column('bookings', 'dispute_resolved_by_id')
    op.drop_column('bookings', 'disputed_by_id')
