"""add_google_oauth_fields_to_user

Revision ID: 5c8d9e1f3a2b
Revises: 4b39e0ac02f2
Create Date: 2025-01-27 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5c8d9e1f3a2b'
down_revision: Union[str, None] = '4b39e0ac02f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add google_id column to users table
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    
    # Add auth_provider column to users table with default value 'local'
    op.add_column('users', sa.Column('auth_provider', sa.String(length=50), nullable=False, server_default='local'))
    
    # Create index on google_id for faster lookups
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index
    op.drop_index('ix_users_google_id', table_name='users')
    
    # Drop columns
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'google_id')