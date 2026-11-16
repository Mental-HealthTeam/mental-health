"""add certificates_eng to psychologists

Revision ID: b7c3d9e41a52
Revises: a4f2c9d17b3e
Create Date: 2026-11-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c3d9e41a52'
down_revision: Union[str, Sequence[str], None] = 'a4f2c9d17b3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    The column is nullable: existing rows stay NULL and fall back to the
    Ukrainian certificates until ``database.populate`` fills the English ones.
    """
    op.add_column(
        'psychologists',
        sa.Column('certificates_eng', sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('psychologists', 'certificates_eng')
