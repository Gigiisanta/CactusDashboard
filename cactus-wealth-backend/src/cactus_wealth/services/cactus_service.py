"""
Service layer for Cactus module operations.
Handles business logic for Ideas, Content Matrix, Video Slots, Library, External Links and Secure Credentials.
"""

from datetime import date
from typing import Any

from sqlmodel import Session

from ..repositories.cactus_repository import CactusRepository
from ..schemas import (
    CactusContentMatrixCreate,
    CactusContentMatrixRead,
    CactusContentMatrixUpdate,
    CactusExternalLinkCreate,
    CactusExternalLinkRead,
    CactusExternalLinkUpdate,
    CactusIdeaCreate,
    CactusIdeaRead,
    CactusIdeaUpdate,
    CactusLibraryCreate,
    CactusLibraryRead,
    CactusLibraryUpdate,
    CactusSecureCredentialCreate,
    CactusSecureCredentialRead,
    CactusSecureCredentialUpdate,
    CactusSecureCredentialValue,
    CactusVideoSlotCreate,
    CactusVideoSlotRead,
    CactusVideoSlotUpdate,
)
from .aws_secrets_service import aws_secrets_service


class CactusService:
    """Service for Cactus module business logic."""

    def __init__(self, session: Session):
        self.session = session
        self.repository = CactusRepository(session)

    # ==================== IDEAS MANAGER ====================

    def create_idea(self, idea_data: CactusIdeaCreate, user_id: int) -> CactusIdeaRead:
        """Create a new idea."""
        idea_dict = idea_data.model_dump()
        idea = self.repository.create_idea(idea_dict, user_id)
        return CactusIdeaRead.model_validate(idea)

    def get_idea_by_id(self, idea_id: int) -> CactusIdeaRead | None:
        """Get idea by ID."""
        idea = self.repository.get_idea_by_id(idea_id)
        if idea:
            return CactusIdeaRead.model_validate(idea)
        return None

    def get_ideas_by_user(self, user_id: int) -> list[CactusIdeaRead]:
        """Get all ideas created by a user."""
        ideas = self.repository.get_ideas_by_user(user_id)
        return [CactusIdeaRead.model_validate(idea) for idea in ideas]

    def get_all_ideas(self) -> list[CactusIdeaRead]:
        """Get all ideas."""
        ideas = self.repository.get_all_ideas()
        return [CactusIdeaRead.model_validate(idea) for idea in ideas]

    def get_ideas_by_status(self, status: str) -> list[CactusIdeaRead]:
        """Get ideas by status."""
        ideas = self.repository.get_ideas_by_status(status)
        return [CactusIdeaRead.model_validate(idea) for idea in ideas]

    def update_idea(self, idea_id: int, idea_data: CactusIdeaUpdate, user_id: int) -> CactusIdeaRead | None:
        """Update an existing idea."""
        idea_dict = idea_data.model_dump(exclude_unset=True)
        idea = self.repository.update_idea(idea_id, idea_dict, user_id)
        if idea:
            return CactusIdeaRead.model_validate(idea)
        return None

    def delete_idea(self, idea_id: int) -> bool:
        """Delete an idea."""
        return self.repository.delete_idea(idea_id)

    def move_idea_to_status(self, idea_id: int, new_status: str, user_id: int) -> CactusIdeaRead | None:
        """Move an idea to a different status (for Kanban board)."""
        return self.update_idea(idea_id, CactusIdeaUpdate(status=new_status), user_id)

    # ==================== CONTENT MATRIX ====================

    def create_content_matrix(self, content_data: CactusContentMatrixCreate, user_id: int) -> CactusContentMatrixRead:
        """Create a new content matrix entry."""
        content_dict = content_data.model_dump()
        content = self.repository.create_content_matrix(content_dict, user_id)
        return CactusContentMatrixRead.model_validate(content)

    def get_content_matrix_by_id(self, content_id: int) -> CactusContentMatrixRead | None:
        """Get content matrix entry by ID."""
        content = self.repository.get_content_matrix_by_id(content_id)
        if content:
            return CactusContentMatrixRead.model_validate(content)
        return None

    def get_all_content_matrix(self) -> list[CactusContentMatrixRead]:
        """Get all content matrix entries."""
        contents = self.repository.get_all_content_matrix()
        return [CactusContentMatrixRead.model_validate(content) for content in contents]

    def get_content_matrix_by_category(self, category: str) -> list[CactusContentMatrixRead]:
        """Get content matrix entries by category."""
        contents = self.repository.get_content_matrix_by_category(category)
        return [CactusContentMatrixRead.model_validate(content) for content in contents]

    def update_content_matrix(self, content_id: int, content_data: CactusContentMatrixUpdate, user_id: int) -> CactusContentMatrixRead | None:
        """Update an existing content matrix entry."""
        content_dict = content_data.model_dump(exclude_unset=True)
        content = self.repository.update_content_matrix(content_id, content_dict, user_id)
        if content:
            return CactusContentMatrixRead.model_validate(content)
        return None

    def delete_content_matrix(self, content_id: int) -> bool:
        """Delete a content matrix entry."""
        return self.repository.delete_content_matrix(content_id)

    # ==================== VIDEO SLOTS ====================

    def create_video_slot(self, video_data: CactusVideoSlotCreate, user_id: int) -> CactusVideoSlotRead:
        """Create a new video slot."""
        video_dict = video_data.model_dump()
        video = self.repository.create_video_slot(video_dict, user_id)
        return CactusVideoSlotRead.model_validate(video)

    def get_video_slot_by_id(self, video_id: int) -> CactusVideoSlotRead | None:
        """Get video slot by ID."""
        video = self.repository.get_video_slot_by_id(video_id)
        if video:
            return CactusVideoSlotRead.model_validate(video)
        return None

    def get_all_video_slots(self) -> list[CactusVideoSlotRead]:
        """Get all video slots."""
        videos = self.repository.get_all_video_slots()
        return [CactusVideoSlotRead.model_validate(video) for video in videos]

    def get_video_slots_by_platform(self, platform: str) -> list[CactusVideoSlotRead]:
        """Get video slots by platform."""
        videos = self.repository.get_video_slots_by_platform(platform)
        return [CactusVideoSlotRead.model_validate(video) for video in videos]

    def get_video_slots_by_date_range(self, start_date: date, end_date: date) -> list[CactusVideoSlotRead]:
        """Get video slots within a date range."""
        videos = self.repository.get_video_slots_by_date_range(start_date, end_date)
        return [CactusVideoSlotRead.model_validate(video) for video in videos]

    def update_video_slot(self, video_id: int, video_data: CactusVideoSlotUpdate, user_id: int) -> CactusVideoSlotRead | None:
        """Update an existing video slot."""
        video_dict = video_data.model_dump(exclude_unset=True)
        video = self.repository.update_video_slot(video_id, video_dict, user_id)
        if video:
            return CactusVideoSlotRead.model_validate(video)
        return None

    def delete_video_slot(self, video_id: int) -> bool:
        """Delete a video slot."""
        return self.repository.delete_video_slot(video_id)

    # ==================== LIBRARY ====================

    def create_library_item(self, library_data: CactusLibraryCreate, user_id: int) -> CactusLibraryRead:
        """Create a new library item."""
        library_dict = library_data.model_dump()
        library = self.repository.create_library_item(library_dict, user_id)
        return CactusLibraryRead.model_validate(library)

    def get_library_item_by_id(self, library_id: int) -> CactusLibraryRead | None:
        """Get library item by ID."""
        library = self.repository.get_library_item_by_id(library_id)
        if library:
            return CactusLibraryRead.model_validate(library)
        return None

    def get_all_library_items(self) -> list[CactusLibraryRead]:
        """Get all library items."""
        libraries = self.repository.get_all_library_items()
        return [CactusLibraryRead.model_validate(library) for library in libraries]

    def get_library_items_by_type(self, library_type: str) -> list[CactusLibraryRead]:
        """Get library items by type."""
        libraries = self.repository.get_library_items_by_type(library_type)
        return [CactusLibraryRead.model_validate(library) for library in libraries]

    def search_library_items(self, search_term: str) -> list[CactusLibraryRead]:
        """Search library items by title, author, or description."""
        libraries = self.repository.search_library_items(search_term)
        return [CactusLibraryRead.model_validate(library) for library in libraries]

    def update_library_item(self, library_id: int, library_data: CactusLibraryUpdate, user_id: int) -> CactusLibraryRead | None:
        """Update an existing library item."""
        library_dict = library_data.model_dump(exclude_unset=True)
        library = self.repository.update_library_item(library_id, library_dict, user_id)
        if library:
            return CactusLibraryRead.model_validate(library)
        return None

    def delete_library_item(self, library_id: int) -> bool:
        """Delete a library item."""
        return self.repository.delete_library_item(library_id)

    # ==================== EXTERNAL LINKS ====================

    def create_external_link(self, link_data: CactusExternalLinkCreate, user_id: int) -> CactusExternalLinkRead:
        """Create a new external link."""
        link_dict = link_data.model_dump()
        # Auto-assign position if not provided
        if 'position' not in link_dict or link_dict['position'] is None:
            existing_links = self.repository.get_all_external_links()
            link_dict['position'] = len(existing_links) + 1

        link = self.repository.create_external_link(link_dict, user_id)
        return CactusExternalLinkRead.model_validate(link)

    def get_external_link_by_id(self, link_id: int) -> CactusExternalLinkRead | None:
        """Get external link by ID."""
        link = self.repository.get_external_link_by_id(link_id)
        if link:
            return CactusExternalLinkRead.model_validate(link)
        return None

    def get_all_external_links(self) -> list[CactusExternalLinkRead]:
        """Get all external links ordered by position."""
        links = self.repository.get_all_external_links()
        return [CactusExternalLinkRead.model_validate(link) for link in links]

    def get_active_external_links(self) -> list[CactusExternalLinkRead]:
        """Get all active external links ordered by position."""
        links = self.repository.get_active_external_links()
        return [CactusExternalLinkRead.model_validate(link) for link in links]

    def update_external_link(self, link_id: int, link_data: CactusExternalLinkUpdate, user_id: int) -> CactusExternalLinkRead | None:
        """Update an existing external link."""
        link_dict = link_data.model_dump(exclude_unset=True)
        link = self.repository.update_external_link(link_id, link_dict, user_id)
        if link:
            return CactusExternalLinkRead.model_validate(link)
        return None

    def delete_external_link(self, link_id: int) -> bool:
        """Delete an external link."""
        return self.repository.delete_external_link(link_id)

    def reorder_external_links(self, link_positions: list[dict[str, int]]) -> bool:
        """Reorder external links by updating their positions."""
        return self.repository.reorder_external_links(link_positions)

    # ==================== SECURE CREDENTIALS ====================

    def create_secure_credential(self, credential_data: CactusSecureCredentialCreate, user_id: int) -> CactusSecureCredentialRead | None:
        """Create a new secure credential with AWS Secrets Manager integration."""
        credential_dict = credential_data.model_dump()

        # Extract the actual credential values
        credential_values = credential_dict.pop('credential_values', {})

        # Generate AWS secret name
        secret_name = f"cactus-{credential_dict['name'].lower().replace(' ', '-')}-{user_id}"

        # Store credentials in AWS Secrets Manager
        if aws_secrets_service.create_secret(secret_name, credential_values, credential_dict.get('description', '')):
            credential_dict['aws_secret_name'] = secret_name
            credential = self.repository.create_secure_credential(credential_dict, user_id)
            return CactusSecureCredentialRead.model_validate(credential)

        return None

    def get_secure_credential_by_id(self, credential_id: int) -> CactusSecureCredentialRead | None:
        """Get secure credential by ID."""
        credential = self.repository.get_secure_credential_by_id(credential_id)
        if credential:
            return CactusSecureCredentialRead.model_validate(credential)
        return None

    def get_secure_credential_values(self, credential_id: int) -> CactusSecureCredentialValue | None:
        """Get secure credential values from AWS Secrets Manager."""
        credential = self.repository.get_secure_credential_by_id(credential_id)
        if not credential or not credential.aws_secret_name:
            return None

        try:
            values = aws_secrets_service.get_secret(credential.aws_secret_name)
            return CactusSecureCredentialValue(
                credential_id=credential_id,
                values=values
            )
        except Exception:
            return None

    def get_all_secure_credentials(self) -> list[CactusSecureCredentialRead]:
        """Get all secure credentials."""
        credentials = self.repository.get_all_secure_credentials()
        return [CactusSecureCredentialRead.model_validate(credential) for credential in credentials]

    def get_secure_credentials_by_category(self, category: str) -> list[CactusSecureCredentialRead]:
        """Get secure credentials by category."""
        credentials = self.repository.get_secure_credentials_by_category(category)
        return [CactusSecureCredentialRead.model_validate(credential) for credential in credentials]

    def update_secure_credential(self, credential_id: int, credential_data: CactusSecureCredentialUpdate, user_id: int) -> CactusSecureCredentialRead | None:
        """Update an existing secure credential."""
        credential = self.repository.get_secure_credential_by_id(credential_id)
        if not credential:
            return None

        credential_dict = credential_data.model_dump(exclude_unset=True)

        # Handle credential values update
        if 'credential_values' in credential_dict:
            credential_values = credential_dict.pop('credential_values')
            if credential.aws_secret_name:
                aws_secrets_service.update_secret(credential.aws_secret_name, credential_values)

        # Update the credential metadata
        updated_credential = self.repository.update_secure_credential(credential_id, credential_dict, user_id)
        if updated_credential:
            return CactusSecureCredentialRead.model_validate(updated_credential)
        return None

    def delete_secure_credential(self, credential_id: int) -> bool:
        """Delete a secure credential and its AWS secret."""
        credential = self.repository.get_secure_credential_by_id(credential_id)
        if not credential:
            return False

        # Delete from AWS Secrets Manager
        if credential.aws_secret_name:
            aws_secrets_service.delete_secret(credential.aws_secret_name)

        # Delete from database
        return self.repository.delete_secure_credential(credential_id)

    # ==================== UTILITY METHODS ====================

    def get_cactus_dashboard_data(self) -> dict[str, Any]:
        """Get dashboard data for Cactus module."""
        # Define valid status values
        valid_statuses = ["IDEA", "RESEARCH", "DEVELOPMENT", "TESTING", "PUBLISHED", "ARCHIVED"]

        return {
            "ideas_count": len(self.get_all_ideas()),
            "content_matrix_count": len(self.get_all_content_matrix()),
            "video_slots_count": len(self.get_all_video_slots()),
            "library_items_count": len(self.get_all_library_items()),
            "external_links_count": len(self.get_all_external_links()),
            "secure_credentials_count": len(self.get_all_secure_credentials()),
            "ideas_by_status": {
                status: len(self.get_ideas_by_status(status))
                for status in valid_statuses
            }
        }
