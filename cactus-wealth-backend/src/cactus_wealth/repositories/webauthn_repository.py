"""
WebAuthn repository for managing WebAuthn credentials.
"""


import json

from sqlalchemy import and_
from sqlalchemy.orm import Session

from cactus_wealth.models import WebAuthnCredential

from .base_repository import BaseRepository


class WebAuthnCredentialRepository(BaseRepository[WebAuthnCredential]):
    """Repository for WebAuthnCredential model operations."""

    def __init__(self, db: Session):
        super().__init__(db, WebAuthnCredential)

    def get_by_user_id(self, user_id: int) -> list[WebAuthnCredential]:
        """Get all WebAuthn credentials for a specific user."""
        return self.db.query(WebAuthnCredential).filter(WebAuthnCredential.user_id == user_id).all()

    def get_by_credential_id(self, credential_id: str) -> WebAuthnCredential | None:
        """Get WebAuthn credential by credential ID."""
        return self.db.query(WebAuthnCredential).filter(WebAuthnCredential.credential_id == credential_id).first()

    def get_active_credentials(self, user_id: int) -> list[WebAuthnCredential]:
        """Get all active WebAuthn credentials for a user."""
        return self.db.query(WebAuthnCredential).filter(
            and_(
                WebAuthnCredential.user_id == user_id,
                WebAuthnCredential.backup_state is False
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

    def create_credential(
        self,
        *,
        user_id: int,
        credential_id: str,
        public_key: bytes,
        sign_count: int,
        transports: list[str] | None = None,
        aaguid: str | None = None,
        backup_eligible: bool = False,
        backup_state: bool = False,
        device_type: str | None = None,
    ) -> WebAuthnCredential:
        """Create and persist a WebAuthn credential for a user."""
        credential = WebAuthnCredential(
            user_id=user_id,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=sign_count,
            transports=json.dumps(transports) if transports is not None else None,
            aaguid=aaguid,
            backup_eligible=backup_eligible,
            backup_state=backup_state,
            device_type=device_type,
        )
        return self.create(credential)

    def delete_by_credential_id(self, credential_id: str) -> bool:
        """Delete a credential by its credential_id."""
        credential = self.get_by_credential_id(credential_id)
        if not credential:
            return False
        self.delete(credential)
        return True
