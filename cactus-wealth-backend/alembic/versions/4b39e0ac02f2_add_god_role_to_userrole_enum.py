"""add_god_role_to_userrole_enum

Revision ID: 4b39e0ac02f2
Revises: e0b602d1ae2f
Create Date: 2025-07-24 23:03:11.258634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b39e0ac02f2'
down_revision: Union[str, None] = 'e0b602d1ae2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add 'GOD' value to the userrole enum (Postgres only). For SQLite, no-op.
    from sqlalchemy import text
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE userrole ADD VALUE 'GOD'")
    else:
        # SQLite: enums are just CHECK constraints; nothing to do
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum and updating all references
    # For now, we'll leave this as a no-op since removing enum values
    # is complex and potentially destructive
    pass
