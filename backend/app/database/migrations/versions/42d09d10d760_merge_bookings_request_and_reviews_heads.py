"""merge bookings request and reviews heads

Revision ID: 42d09d10d760
Revises: 0ccc67af3ea5, 9c4f8c2be4bf
Create Date: 2026-11-28 14:11:55.260120

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42d09d10d760'
down_revision: Union[str, Sequence[str], None] = ('0ccc67af3ea5', '9c4f8c2be4bf')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
