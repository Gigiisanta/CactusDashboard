# file: /Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/repositories/webauthn_repository.py
"""
WebAuthn credential repository for database operations.
"""

import json

from sqlmodel import Session, select

from cactus_wealth.models import WebAuthnCredential
from cactus_wealth.repositories.base_repository import BaseRepository


class WebAuthnCredentialRepository(BaseRepository[WebAuthnCredential]):
    """Repository for WebAuthn credential operations."""

    def __init__(self, session: Session):
        super().__init__(WebAuthnCredential, session)

    async def get_by_credential_id(self, credential_id: str) -> WebAuthnCredential | None:
        """Get credential by credential_id."""
        statement = select(WebAuthnCredential).where(
            WebAuthnCredential.credential_id == credential_id
        )
        result = self.session.exec(statement)
        return result.first()

    async def get_by_user_id(self, user_id: int) -> list[WebAuthnCredential]:
        """Get all credentials for a user."""
        statement = select(WebAuthnCredential).where(
            WebAuthnCredential.user_id == user_id
        )
        result = self.session.exec(statement)
        return list(result.all())

    async def create_credential(
        self,
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
        """Create a new WebAuthn credential."""
        transports_json = json.dumps(transports) if transports else None

        credential = WebAuthnCredential(
            user_id=user_id,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=sign_count,
            transports=transports_json,
            aaguid=aaguid,
            backup_eligible=backup_eligible,
            backup_state=backup_state,
            device_type=device_type,
        )

        self.session.add(credential)
        self.session.commit()
        self.session.refresh(credential)
        return credential

    async def update_sign_count(
        self, credential_id: str, new_sign_count: int
    ) -> WebAuthnCredential | None:
        """Update the sign count for a credential."""
        credential = await self.get_by_credential_id(credential_id)
        if credential:
            credential.sign_count = new_sign_count
            from datetime import datetime
            credential.last_used_at = datetime.utcnow()
            self.session.add(credential)
            self.session.commit()
            self.session.refresh(credential)
        return credential

    async def delete_by_credential_id(self, credential_id: str) -> bool:
        """Delete a credential by credential_id."""
        credential = await self.get_by_credential_id(credential_id)
        if credential:
            self.session.delete(credential)
            self.session.commit()
            return True
        return False

    async def delete_by_user_id(self, user_id: int) -> int:
        """Delete all credentials for a user. Returns count of deleted credentials."""
        credentials = await self.get_by_user_id(user_id)
        count = len(credentials)
        for credential in credentials:
            self.session.delete(credential)
        self.session.commit()
        return count
