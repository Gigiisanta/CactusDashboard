"""add manager_change_requests table

Revision ID: mgr_req_20250808
Revises: 4b39e0ac02f2
Create Date: 2025-08-08
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'mgr_req_20250808'
down_revision = '4b39e0ac02f2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'manager_change_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('advisor_id', sa.Integer(), nullable=False),
        sa.Column('desired_manager_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('decided_at', sa.DateTime(), nullable=True),
        sa.Column('decided_by_user_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['advisor_id'], ['users.id']),
        sa.ForeignKeyConstraint(['desired_manager_id'], ['users.id']),
        sa.ForeignKeyConstraint(['decided_by_user_id'], ['users.id']),
    )
    op.create_index('ix_manager_change_requests_advisor_id', 'manager_change_requests', ['advisor_id'])
    op.create_index('ix_manager_change_requests_status', 'manager_change_requests', ['status'])


def downgrade() -> None:
    op.drop_index('ix_manager_change_requests_status', table_name='manager_change_requests')
    op.drop_index('ix_manager_change_requests_advisor_id', table_name='manager_change_requests')
    op.drop_table('manager_change_requests')


