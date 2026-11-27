"""add saved to bookings

Revision ID: 400bfd4b7a1f
Revises: c5e8a1f27d94
Create Date: 2026-11-24 01:55:39.906790

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '400bfd4b7a1f'
down_revision: Union[str, Sequence[str], None] = 'c5e8a1f27d94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'bookings',
        sa.Column(
            'saved',
            sa.Boolean(),
            server_default=sa.text('false'),
            nullable=False
        )
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('bookings', 'saved')
