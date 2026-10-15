"""add psychologist payout and english fields

Revision ID: 7d78dc365913
Revises: 8cba3eb7f816
Create Date: 2026-10-13 18:35:25.629789

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d78dc365913'
down_revision: Union[str, Sequence[str], None] = '8cba3eb7f816'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    The new columns are NOT NULL, so the psychologists table must be empty:
    recreate the database (or clear the table) and run ``database.populate``.
    """
    op.add_column('psychologists', sa.Column('full_name_eng', sa.String(length=100), nullable=False))
    op.add_column('psychologists', sa.Column('title_eng', sa.String(length=255), nullable=False))
    op.add_column('psychologists', sa.Column('bio_eng', sa.JSON(), nullable=False))
    op.add_column('psychologists', sa.Column('methods_eng', sa.JSON(), nullable=True))
    op.add_column('psychologists', sa.Column('iban', sa.String(length=29), nullable=False))
    op.add_column('psychologists', sa.Column('tax_id', sa.String(length=10), nullable=False))
    op.add_column('psychologists', sa.Column('account_name', sa.String(length=255), nullable=False))
    op.create_unique_constraint('psychologists_iban_key', 'psychologists', ['iban'])
    op.create_unique_constraint('psychologists_tax_id_key', 'psychologists', ['tax_id'])
    op.drop_column('psychologists', 'payout_card_token')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('psychologists', sa.Column('payout_card_token', sa.String(length=255), nullable=True))
    op.drop_constraint('psychologists_tax_id_key', 'psychologists', type_='unique')
    op.drop_constraint('psychologists_iban_key', 'psychologists', type_='unique')
    op.drop_column('psychologists', 'account_name')
    op.drop_column('psychologists', 'tax_id')
    op.drop_column('psychologists', 'iban')
    op.drop_column('psychologists', 'methods_eng')
    op.drop_column('psychologists', 'bio_eng')
    op.drop_column('psychologists', 'title_eng')
    op.drop_column('psychologists', 'full_name_eng')
