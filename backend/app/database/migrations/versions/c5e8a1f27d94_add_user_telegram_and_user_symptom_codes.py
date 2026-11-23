"""add telegram to users and user_symptom_codes table

Revision ID: c5e8a1f27d94
Revises: b7c3d9e41a52
Create Date: 2026-11-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c5e8a1f27d94'
down_revision: Union[str, Sequence[str], None] = 'b7c3d9e41a52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    The ``symptom_code`` enum type already exists (it is used by
    ``psychologist_specializations`` and ``ai_session_symptom_codes``), so it
    is reused with ``create_type=False`` instead of being created again.
    """
    op.add_column(
        'users',
        sa.Column('telegram', sa.String(length=255), nullable=True),
    )
    op.create_unique_constraint('uq_users_telegram', 'users', ['telegram'])

    op.create_table(
        'user_symptom_codes',
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column(
            'symptom_code',
            postgresql.ENUM(
                'ANXIETY', 'BURNOUT', 'RELATIONSHIP', 'STRESS', 'GRIEF',
                'SELF_ESTEEM', 'LOW_MOOD', 'SLEEP', 'FAMILY', 'ANGER',
                'TRAUMA', 'ADDICTION', 'EATING', 'LONELINESS', 'IDENTITY',
                'WORK_CAREER', 'MOTIVATION',
                name='symptom_code',
                create_type=False,
            ),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('user_id', 'symptom_code'),
    )


def downgrade() -> None:
    """Downgrade schema.

    The shared ``symptom_code`` enum type is not dropped: other tables
    still use it.
    """
    op.drop_table('user_symptom_codes')
    op.drop_constraint('uq_users_telegram', 'users', type_='unique')
    op.drop_column('users', 'telegram')
