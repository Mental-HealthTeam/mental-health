"""move psychologist avatar to users

Revision ID: a4f2c9d17b3e
Revises: e36e791c2538
Create Date: 2026-10-31 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a4f2c9d17b3e'
down_revision: Union[str, Sequence[str], None] = 'e36e791c2538'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
        UPDATE users
        SET avatar_url = psychologists.avatar_url
        FROM psychologists
        WHERE users.id = psychologists.psychologist_id
          AND psychologists.avatar_url IS NOT NULL
        """
    )
    op.drop_column('psychologists', 'avatar_url')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'psychologists',
        sa.Column('avatar_url', sa.String(length=255), nullable=True)
    )
    # users.avatar_url allows 500 characters, longer values do not fit here.
    op.execute(
        """
        UPDATE psychologists
        SET avatar_url = users.avatar_url
        FROM users
        WHERE users.id = psychologists.psychologist_id
          AND LENGTH(users.avatar_url) <= 255
        """
    )
