"""
WebAuthn repository for managing WebAuthn credentials.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .base_repository import BaseRepository
from cactus_wealth.models import WebAuthnCredential


class WebAuthnCredentialRepository(BaseRepository[WebAuthnCredential]):
    """Repository for WebAuthnCredential model operations."""
    
    def __init__(self, db: Session):
        super().__init__(db, WebAuthnCredential)
    
    def get_by_user_id(self, user_id: int) -> List[WebAuthnCredential]:
        """Get all WebAuthn credentials for a specific user."""
        return self.db.query(WebAuthnCredential).filter(WebAuthnCredential.user_id == user_id).all()
    
    def get_by_credential_id(self, credential_id: str) -> Optional[WebAuthnCredential]:
        """Get WebAuthn credential by credential ID."""
        return self.db.query(WebAuthnCredential).filter(WebAuthnCredential.credential_id == credential_id).first()
    
    def get_active_credentials(self, user_id: int) -> List[WebAuthnCredential]:
        """Get all active WebAuthn credentials for a user."""
        return self.db.query(WebAuthnCredential).filter(
            and_(
                WebAuthnCredential.user_id == user_id,
                WebAuthnCredential.backup_state == False
            )
        ).all()
    
    def update_sign_count(self, credential_id: str, sign_count: int) -> bool:
        """Update the sign count for a credential."""
        credential = self.get_by_credential_id(credential_id)
        if credential:
            credential.sign_count = sign_count
            self.db.commit()
            return True
        return False
    
    def update_last_used(self, credential_id: str) -> bool:
        """Update the last used timestamp for a credential."""
        from datetime import datetime
        credential = self.get_by_credential_id(credential_id)
        if credential:
            credential.last_used_at = datetime.utcnow()
            self.db.commit()
            return True
        return False 