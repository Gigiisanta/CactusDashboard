"""
Repository for Cactus module operations.
Handles database operations for Ideas, Content Matrix, Video Slots, Library, External Links and Secure Credentials.
"""

from typing import List, Optional, Dict, Any
from sqlmodel import Session, select, and_, or_
from datetime import datetime, date

from ..models import (
    CactusIdea, CactusContentMatrix, CactusVideoSlot, CactusLibrary,
    CactusExternalLink, CactusSecureCredential, User
)


class CactusRepository:
    """Repository for Cactus module database operations."""

    def __init__(self, session: Session):
        self.session = session

    # ==================== IDEAS MANAGER ====================

    def create_idea(self, idea_data: Dict[str, Any], user_id: int) -> CactusIdea:
        """Create a new idea."""
        idea = CactusIdea(
            **idea_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(idea)
        self.session.commit()
        self.session.refresh(idea)
        return idea

    def get_idea_by_id(self, idea_id: int) -> Optional[CactusIdea]:
        """Get idea by ID."""
        return self.session.get(CactusIdea, idea_id)

    def get_ideas_by_user(self, user_id: int) -> List[CactusIdea]:
        """Get all ideas created by a user."""
        statement = select(CactusIdea).where(CactusIdea.created_by == user_id)
        return list(self.session.exec(statement))

    def get_all_ideas(self) -> List[CactusIdea]:
        """Get all ideas."""
        statement = select(CactusIdea).order_by(CactusIdea.created_at.desc())
        return list(self.session.exec(statement))

    def get_ideas_by_status(self, status: str) -> List[CactusIdea]:
        """Get ideas by status."""
        statement = select(CactusIdea).where(CactusIdea.status == status)
        return list(self.session.exec(statement))

    def update_idea(self, idea_id: int, idea_data: Dict[str, Any], user_id: int) -> Optional[CactusIdea]:
        """Update an existing idea."""
        idea = self.session.get(CactusIdea, idea_id)
        if not idea:
            return None
        
        for key, value in idea_data.items():
            if hasattr(idea, key):
                setattr(idea, key, value)
        
        idea.updated_by = user_id
        idea.updated_at = datetime.utcnow()
        
        self.session.add(idea)
        self.session.commit()
        self.session.refresh(idea)
        return idea

    def delete_idea(self, idea_id: int) -> bool:
        """Delete an idea."""
        idea = self.session.get(CactusIdea, idea_id)
        if not idea:
            return False
        
        self.session.delete(idea)
        self.session.commit()
        return True

    # ==================== CONTENT MATRIX ====================

    def create_content_matrix(self, content_data: Dict[str, Any], user_id: int) -> CactusContentMatrix:
        """Create a new content matrix entry."""
        content = CactusContentMatrix(
            **content_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(content)
        self.session.commit()
        self.session.refresh(content)
        return content

    def get_content_matrix_by_id(self, content_id: int) -> Optional[CactusContentMatrix]:
        """Get content matrix entry by ID."""
        return self.session.get(CactusContentMatrix, content_id)

    def get_all_content_matrix(self) -> List[CactusContentMatrix]:
        """Get all content matrix entries."""
        statement = select(CactusContentMatrix).order_by(CactusContentMatrix.created_at.desc())
        return list(self.session.exec(statement))

    def get_content_matrix_by_category(self, category: str) -> List[CactusContentMatrix]:
        """Get content matrix entries by category."""
        statement = select(CactusContentMatrix).where(CactusContentMatrix.category == category)
        return list(self.session.exec(statement))

    def update_content_matrix(self, content_id: int, content_data: Dict[str, Any], user_id: int) -> Optional[CactusContentMatrix]:
        """Update an existing content matrix entry."""
        content = self.session.get(CactusContentMatrix, content_id)
        if not content:
            return None
        
        for key, value in content_data.items():
            if hasattr(content, key):
                setattr(content, key, value)
        
        content.updated_by = user_id
        content.updated_at = datetime.utcnow()
        
        self.session.add(content)
        self.session.commit()
        self.session.refresh(content)
        return content

    def delete_content_matrix(self, content_id: int) -> bool:
        """Delete a content matrix entry."""
        content = self.session.get(CactusContentMatrix, content_id)
        if not content:
            return False
        
        self.session.delete(content)
        self.session.commit()
        return True

    # ==================== VIDEO SLOTS ====================

    def create_video_slot(self, video_data: Dict[str, Any], user_id: int) -> CactusVideoSlot:
        """Create a new video slot."""
        video = CactusVideoSlot(
            **video_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)
        return video

    def get_video_slot_by_id(self, video_id: int) -> Optional[CactusVideoSlot]:
        """Get video slot by ID."""
        return self.session.get(CactusVideoSlot, video_id)

    def get_all_video_slots(self) -> List[CactusVideoSlot]:
        """Get all video slots."""
        statement = select(CactusVideoSlot).order_by(CactusVideoSlot.scheduled_date.desc())
        return list(self.session.exec(statement))

    def get_video_slots_by_platform(self, platform: str) -> List[CactusVideoSlot]:
        """Get video slots by platform."""
        statement = select(CactusVideoSlot).where(CactusVideoSlot.platform == platform)
        return list(self.session.exec(statement))

    def get_video_slots_by_date_range(self, start_date: date, end_date: date) -> List[CactusVideoSlot]:
        """Get video slots within a date range."""
        statement = select(CactusVideoSlot).where(
            and_(
                CactusVideoSlot.scheduled_date >= start_date,
                CactusVideoSlot.scheduled_date <= end_date
            )
        )
        return list(self.session.exec(statement))

    def update_video_slot(self, video_id: int, video_data: Dict[str, Any], user_id: int) -> Optional[CactusVideoSlot]:
        """Update an existing video slot."""
        video = self.session.get(CactusVideoSlot, video_id)
        if not video:
            return None
        
        for key, value in video_data.items():
            if hasattr(video, key):
                setattr(video, key, value)
        
        video.updated_by = user_id
        video.updated_at = datetime.utcnow()
        
        self.session.add(video)
        self.session.commit()
        self.session.refresh(video)
        return video

    def delete_video_slot(self, video_id: int) -> bool:
        """Delete a video slot."""
        video = self.session.get(CactusVideoSlot, video_id)
        if not video:
            return False
        
        self.session.delete(video)
        self.session.commit()
        return True

    # ==================== LIBRARY ====================

    def create_library_item(self, library_data: Dict[str, Any], user_id: int) -> CactusLibrary:
        """Create a new library item."""
        library = CactusLibrary(
            **library_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(library)
        self.session.commit()
        self.session.refresh(library)
        return library

    def get_library_item_by_id(self, library_id: int) -> Optional[CactusLibrary]:
        """Get library item by ID."""
        return self.session.get(CactusLibrary, library_id)

    def get_all_library_items(self) -> List[CactusLibrary]:
        """Get all library items."""
        statement = select(CactusLibrary).order_by(CactusLibrary.created_at.desc())
        return list(self.session.exec(statement))

    def get_library_items_by_type(self, library_type: str) -> List[CactusLibrary]:
        """Get library items by type."""
        statement = select(CactusLibrary).where(CactusLibrary.content_type == library_type)
        return list(self.session.exec(statement))

    def search_library_items(self, search_term: str) -> List[CactusLibrary]:
        """Search library items by title, author, or description."""
        statement = select(CactusLibrary).where(
            or_(
                CactusLibrary.title.ilike(f"%{search_term}%"),
                CactusLibrary.author.ilike(f"%{search_term}%"),
                CactusLibrary.description.ilike(f"%{search_term}%")
            )
        )
        return list(self.session.exec(statement))

    def update_library_item(self, library_id: int, library_data: Dict[str, Any], user_id: int) -> Optional[CactusLibrary]:
        """Update an existing library item."""
        library = self.session.get(CactusLibrary, library_id)
        if not library:
            return None
        
        for key, value in library_data.items():
            if hasattr(library, key):
                setattr(library, key, value)
        
        library.updated_by = user_id
        library.updated_at = datetime.utcnow()
        
        self.session.add(library)
        self.session.commit()
        self.session.refresh(library)
        return library

    def delete_library_item(self, library_id: int) -> bool:
        """Delete a library item."""
        library = self.session.get(CactusLibrary, library_id)
        if not library:
            return False
        
        self.session.delete(library)
        self.session.commit()
        return True

    # ==================== EXTERNAL LINKS ====================

    def create_external_link(self, link_data: Dict[str, Any], user_id: int) -> CactusExternalLink:
        """Create a new external link."""
        link = CactusExternalLink(
            **link_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(link)
        self.session.commit()
        self.session.refresh(link)
        return link

    def get_external_link_by_id(self, link_id: int) -> Optional[CactusExternalLink]:
        """Get external link by ID."""
        return self.session.get(CactusExternalLink, link_id)

    def get_all_external_links(self) -> List[CactusExternalLink]:
        """Get all external links ordered by position."""
        statement = select(CactusExternalLink).order_by(CactusExternalLink.position)
        return list(self.session.exec(statement))

    def get_active_external_links(self) -> List[CactusExternalLink]:
        """Get all active external links ordered by position."""
        statement = select(CactusExternalLink).where(
            CactusExternalLink.is_active == True
        ).order_by(CactusExternalLink.position)
        return list(self.session.exec(statement))

    def update_external_link(self, link_id: int, link_data: Dict[str, Any], user_id: int) -> Optional[CactusExternalLink]:
        """Update an existing external link."""
        link = self.session.get(CactusExternalLink, link_id)
        if not link:
            return None
        
        for key, value in link_data.items():
            if hasattr(link, key):
                setattr(link, key, value)
        
        link.updated_by = user_id
        link.updated_at = datetime.utcnow()
        
        self.session.add(link)
        self.session.commit()
        self.session.refresh(link)
        return link

    def delete_external_link(self, link_id: int) -> bool:
        """Delete an external link."""
        link = self.session.get(CactusExternalLink, link_id)
        if not link:
            return False
        
        self.session.delete(link)
        self.session.commit()
        return True

    def reorder_external_links(self, link_positions: List[Dict[str, int]]) -> bool:
        """Reorder external links by updating their positions."""
        try:
            for item in link_positions:
                link = self.session.get(CactusExternalLink, item['id'])
                if link:
                    link.position = item['position']
                    self.session.add(link)
            
            self.session.commit()
            return True
        except Exception:
            self.session.rollback()
            return False

    # ==================== SECURE CREDENTIALS ====================

    def create_secure_credential(self, credential_data: Dict[str, Any], user_id: int) -> CactusSecureCredential:
        """Create a new secure credential."""
        credential = CactusSecureCredential(
            **credential_data,
            created_by=user_id,
            updated_by=user_id
        )
        self.session.add(credential)
        self.session.commit()
        self.session.refresh(credential)
        return credential

    def get_secure_credential_by_id(self, credential_id: int) -> Optional[CactusSecureCredential]:
        """Get secure credential by ID."""
        return self.session.get(CactusSecureCredential, credential_id)

    def get_all_secure_credentials(self) -> List[CactusSecureCredential]:
        """Get all secure credentials."""
        statement = select(CactusSecureCredential).order_by(CactusSecureCredential.name)
        return list(self.session.exec(statement))

    def get_secure_credentials_by_category(self, category: str) -> List[CactusSecureCredential]:
        """Get secure credentials by category."""
        statement = select(CactusSecureCredential).where(CactusSecureCredential.category == category)
        return list(self.session.exec(statement))

    def update_secure_credential(self, credential_id: int, credential_data: Dict[str, Any], user_id: int) -> Optional[CactusSecureCredential]:
        """Update an existing secure credential."""
        credential = self.session.get(CactusSecureCredential, credential_id)
        if not credential:
            return None
        
        for key, value in credential_data.items():
            if hasattr(credential, key):
                setattr(credential, key, value)
        
        credential.updated_by = user_id
        credential.updated_at = datetime.utcnow()
        
        self.session.add(credential)
        self.session.commit()
        self.session.refresh(credential)
        return credential

    def delete_secure_credential(self, credential_id: int) -> bool:
        """Delete a secure credential."""
        credential = self.session.get(CactusSecureCredential, credential_id)
        if not credential:
            return False
        
        self.session.delete(credential)
        self.session.commit()
        return True