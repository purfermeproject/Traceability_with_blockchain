"""add_processing_enum

Revision ID: 70182b3d9e4e
Revises: e63c53a6fa42
Create Date: 2026-02-26 09:37:41.936376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70182b3d9e4e'
down_revision: Union[str, Sequence[str], None] = 'e63c53a6fa42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE cropstage ADD VALUE IF NOT EXISTS 'PROCESSING';")


def downgrade() -> None:
    """Downgrade schema."""
    pass
