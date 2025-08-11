"""add cactus module tables

Revision ID: add_cactus_module_tables
Revises: 8fd147a36583
Create Date: 2025-01-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'add_cactus_module_tables'
down_revision: Union[str, None] = '8fd147a36583'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create cactus_ideas table
    op.create_table('cactus_ideas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cactus_ideas_created_at', 'cactus_ideas', ['created_at'], unique=False)
    op.create_index('ix_cactus_ideas_created_by', 'cactus_ideas', ['created_by'], unique=False)
    op.create_index('ix_cactus_ideas_due_date', 'cactus_ideas', ['due_date'], unique=False)
    op.create_index('ix_cactus_ideas_priority', 'cactus_ideas', ['priority'], unique=False)
    op.create_index('ix_cactus_ideas_status', 'cactus_ideas', ['status'], unique=False)
    op.create_index('ix_cactus_ideas_status_priority', 'cactus_ideas', ['status', 'priority'], unique=False)
    op.create_index('ix_cactus_ideas_title', 'cactus_ideas', ['title'], unique=False)
    op.create_index('ix_cactus_ideas_updated_at', 'cactus_ideas', ['updated_at'], unique=False)

    # Create cactus_content_matrix table
    op.create_table('cactus_content_matrix',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('category', sa.Text(), nullable=False),
        sa.Column('target_audience', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('keywords', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('content_brief', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('estimated_duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cactus_content_matrix_category', 'cactus_content_matrix', ['category'], unique=False)
    op.create_index('ix_cactus_content_matrix_created_at', 'cactus_content_matrix', ['created_at'], unique=False)
    op.create_index('ix_cactus_content_matrix_created_by', 'cactus_content_matrix', ['created_by'], unique=False)
    op.create_index('ix_cactus_content_matrix_title', 'cactus_content_matrix', ['title'], unique=False)
    op.create_index('ix_cactus_content_matrix_updated_at', 'cactus_content_matrix', ['updated_at'], unique=False)

    # Create cactus_video_slots table
    op.create_table('cactus_video_slots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('platform', sa.Text(), nullable=False),
        sa.Column('scheduled_date', sa.DateTime(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('script_notes', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('hashtags', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cactus_video_slots_created_at', 'cactus_video_slots', ['created_at'], unique=False)
    op.create_index('ix_cactus_video_slots_created_by', 'cactus_video_slots', ['created_by'], unique=False)
    op.create_index('ix_cactus_video_slots_is_published', 'cactus_video_slots', ['is_published'], unique=False)
    op.create_index('ix_cactus_video_slots_platform', 'cactus_video_slots', ['platform'], unique=False)
    op.create_index('ix_cactus_video_slots_platform_date', 'cactus_video_slots', ['platform', 'scheduled_date'], unique=False)
    op.create_index('ix_cactus_video_slots_scheduled_date', 'cactus_video_slots', ['scheduled_date'], unique=False)
    op.create_index('ix_cactus_video_slots_title', 'cactus_video_slots', ['title'], unique=False)
    op.create_index('ix_cactus_video_slots_updated_at', 'cactus_video_slots', ['updated_at'], unique=False)

    # Create cactus_library table
    op.create_table('cactus_library',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('author', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('content_type', sa.Text(), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('tags', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cactus_library_author', 'cactus_library', ['author'], unique=False)
    op.create_index('ix_cactus_library_created_at', 'cactus_library', ['created_at'], unique=False)
    op.create_index('ix_cactus_library_created_by', 'cactus_library', ['created_by'], unique=False)
    op.create_index('ix_cactus_library_is_completed', 'cactus_library', ['is_completed'], unique=False)
    op.create_index('ix_cactus_library_rating', 'cactus_library', ['rating'], unique=False)
    op.create_index('ix_cactus_library_title', 'cactus_library', ['title'], unique=False)
    op.create_index('ix_cactus_library_content_type', 'cactus_library', ['content_type'], unique=False)
    op.create_index('ix_cactus_library_content_type_rating', 'cactus_library', ['content_type', 'rating'], unique=False)
    op.create_index('ix_cactus_library_updated_at', 'cactus_library', ['updated_at'], unique=False)

    # Create cactus_external_links table
    op.create_table('cactus_external_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('icon', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('category', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_cactus_external_links_category', 'cactus_external_links', ['category'], unique=False)
    op.create_index('ix_cactus_external_links_category_order', 'cactus_external_links', ['category', 'order_index'], unique=False)
    op.create_index('ix_cactus_external_links_created_at', 'cactus_external_links', ['created_at'], unique=False)
    op.create_index('ix_cactus_external_links_created_by', 'cactus_external_links', ['created_by'], unique=False)
    op.create_index('ix_cactus_external_links_is_active', 'cactus_external_links', ['is_active'], unique=False)
    op.create_index('ix_cactus_external_links_order_index', 'cactus_external_links', ['order_index'], unique=False)
    op.create_index('ix_cactus_external_links_title', 'cactus_external_links', ['title'], unique=False)
    op.create_index('ix_cactus_external_links_updated_at', 'cactus_external_links', ['updated_at'], unique=False)

    # Create cactus_secure_credentials table
    op.create_table('cactus_secure_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('service_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('aws_secret_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('aws_secret_name')
    )
    op.create_index('ix_cactus_secure_credentials_aws_secret_name', 'cactus_secure_credentials', ['aws_secret_name'], unique=False)
    op.create_index('ix_cactus_secure_credentials_created_at', 'cactus_secure_credentials', ['created_at'], unique=False)
    op.create_index('ix_cactus_secure_credentials_created_by', 'cactus_secure_credentials', ['created_by'], unique=False)
    op.create_index('ix_cactus_secure_credentials_name', 'cactus_secure_credentials', ['name'], unique=False)
    op.create_index('ix_cactus_secure_credentials_service_type', 'cactus_secure_credentials', ['service_type'], unique=False)
    op.create_index('ix_cactus_secure_credentials_updated_at', 'cactus_secure_credentials', ['updated_at'], unique=False)
    
    # Add CHECK constraints for enum validation
    op.execute("ALTER TABLE cactus_ideas ADD CONSTRAINT check_status CHECK (status IN ('IDEA', 'RESEARCH', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'))")
    op.execute("ALTER TABLE cactus_content_matrix ADD CONSTRAINT check_category CHECK (category IN ('EDUCATION', 'MARKET_ANALYSIS', 'PRODUCT_REVIEW', 'NEWS', 'TUTORIAL', 'OPINION'))")
    op.execute("ALTER TABLE cactus_video_slots ADD CONSTRAINT check_platform CHECK (platform IN ('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN'))")
    op.execute("ALTER TABLE cactus_library ADD CONSTRAINT check_content_type CHECK (content_type IN ('BOOK', 'PODCAST', 'VIDEO', 'ARTICLE', 'COURSE'))")


def downgrade() -> None:
    """Downgrade schema."""
    # Drop CHECK constraints
    op.execute("ALTER TABLE cactus_library DROP CONSTRAINT IF EXISTS check_content_type")
    op.execute("ALTER TABLE cactus_video_slots DROP CONSTRAINT IF EXISTS check_platform")
    op.execute("ALTER TABLE cactus_content_matrix DROP CONSTRAINT IF EXISTS check_category")
    op.execute("ALTER TABLE cactus_ideas DROP CONSTRAINT IF EXISTS check_status")
    
    # Drop tables
    op.drop_table('cactus_secure_credentials')
    op.drop_table('cactus_external_links')
    op.drop_table('cactus_library')
    op.drop_table('cactus_video_slots')
    op.drop_table('cactus_content_matrix')
    op.drop_table('cactus_ideas')