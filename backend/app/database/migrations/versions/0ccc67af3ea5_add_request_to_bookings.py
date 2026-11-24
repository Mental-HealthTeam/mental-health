"""add request to bookings

Revision ID: 0ccc67af3ea5
Revises: 400bfd4b7a1f
Create Date: 2026-11-24 03:01:01.329163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0ccc67af3ea5'
down_revision: Union[str, Sequence[str], None] = '400bfd4b7a1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    The ``symptom_code`` enum type already exists, so it is reused with
    ``create_type=False`` instead of being created again.
    """
    op.add_column(
        'bookings',
        sa.Column(
            'request',
            sa.ARRAY(
                postgresql.ENUM(name='symptom_code', create_type=False)
            ),
            nullable=True
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('bookings', 'request')
