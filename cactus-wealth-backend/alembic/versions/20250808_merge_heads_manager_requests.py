"""merge multiple heads into one

Revision ID: merge_mgr_heads_20250808
Revises: mgr_req_20250808, 3c9dd9582201, 5c8d9e1f3a2b
Create Date: 2025-08-08
"""

from alembic import op
import sqlalchemy as sa

revision = 'merge_mgr_heads_20250808'
down_revision = ('mgr_req_20250808', '3c9dd9582201', '5c8d9e1f3a2b')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op merge
    pass


def downgrade() -> None:
    # No-op merge
    pass


