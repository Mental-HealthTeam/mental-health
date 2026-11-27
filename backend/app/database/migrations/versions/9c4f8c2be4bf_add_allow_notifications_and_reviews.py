"""add allow_notifications to users and reviews table

Revision ID: 9c4f8c2be4bf
Revises: 400bfd4b7a1f
Create Date: 2026-11-26 23:13:37.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c4f8c2be4bf'
down_revision: Union[str, Sequence[str], None] = '400bfd4b7a1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'users',
        sa.Column(
            'allow_notifications',
            sa.Boolean(),
            server_default=sa.text('false'),
            nullable=False
        )
    )
    op.create_table(
        'reviews',
        sa.Column('booking_id', sa.Uuid(), nullable=False),
        sa.Column('client_id', sa.Uuid(), nullable=False),
        sa.Column('psychologist_id', sa.Uuid(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.String(length=1000), nullable=True),
        sa.Column('review_text_eng', sa.String(length=1000), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False
        ),
        sa.CheckConstraint(
            'length(TRIM(review_text)) BETWEEN 10 AND 1000',
            name='ck_review_text_length'
        ),
        sa.CheckConstraint(
            'length(TRIM(review_text_eng)) BETWEEN 10 AND 1000',
            name='ck_review_text_eng_length'
        ),
        sa.CheckConstraint(
            'client_id <> psychologist_id',
            name='ck_review_client_not_psychologist'
        ),
        sa.CheckConstraint(
            'rating BETWEEN 1 AND 5',
            name='ck_review_rating_range'
        ),
        sa.CheckConstraint(
            "NULLIF(TRIM(review_text), '') IS NOT NULL "
            "OR NULLIF(TRIM(review_text_eng), '') IS NOT NULL",
            name='ck_review_text_not_blank'
        ),
        sa.ForeignKeyConstraint(
            ['booking_id'],
            ['bookings.id'],
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['client_id'],
            ['users.id'],
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['psychologist_id'],
            ['psychologists.psychologist_id'],
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('booking_id')
    )
    op.drop_column('psychologists', 'reviews')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'psychologists',
        sa.Column('reviews', sa.JSON(), nullable=True)
    )
    op.drop_table('reviews')
    op.drop_column('users', 'allow_notifications')
