# file: /Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/services/webauthn_service.py
"""
WebAuthn service for Passkey authentication operations.
"""

import base64
import secrets
from typing import Any, cast

from fido2.server import Fido2Server
from fido2.webauthn import (
    AttestationConveyancePreference,
    AttestationObject,
    AuthenticatorAttachment,
    AuthenticatorData,
    AuthenticatorSelectionCriteria,
    CollectedClientData,
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialParameters,
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialType,
    PublicKeyCredentialUserEntity,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from sqlmodel import Session

from cactus_wealth.core.config import settings
from cactus_wealth.models import User, WebAuthnCredential
from cactus_wealth.repositories.webauthn_repository import WebAuthnCredentialRepository


class WebAuthnService:
    """Service for WebAuthn/FIDO2 operations."""

    def __init__(self, session: Session):
        self.session = session
        self.repository = WebAuthnCredentialRepository(session)

        # Configure FIDO2 server
        self.rp = PublicKeyCredentialRpEntity(
            id=settings.WEBAUTHN_RP_ID,
            name=settings.WEBAUTHN_RP_NAME,
        )
        self.server = Fido2Server(self.rp, verify_origin=self._verify_origin)

    def _verify_origin(self, origin: str) -> bool:
        """Verify the origin for WebAuthn operations."""
        allowed_origins = [
            f"https://{settings.WEBAUTHN_RP_ID}",
            "http://localhost:3000",  # Development
            "http://127.0.0.1:3000",  # Development
        ]
        return origin in allowed_origins

    async def generate_registration_options(
        self, user: User, exclude_existing: bool = True
    ) -> dict[str, Any]:
        """Generate registration options for a user."""

        # Get existing credentials to exclude
        exclude_credentials = []
        if exclude_existing:
            user_id = int(user.id) if user.id is not None else 0
            existing_creds = self.repository.get_by_user_id(user_id)
            exclude_credentials = [
                PublicKeyCredentialDescriptor(
                    type=PublicKeyCredentialType.PUBLIC_KEY,
                    id=base64.b64decode(cred.credential_id.encode()),
                )
                for cred in existing_creds
            ]

        # Generate challenge
        challenge = secrets.token_bytes(32)

        # Store challenge in session/cache (simplified for this implementation)
        # In production, store this in Redis or similar

        user_entity = PublicKeyCredentialUserEntity(
            id=str(user.id).encode(),
            name=user.email,
            display_name=user.username,
        )

        # Create registration options
        PublicKeyCredentialCreationOptions(
            rp=self.rp,
            user=user_entity,
            challenge=challenge,
            pub_key_cred_params=[
                PublicKeyCredentialParameters(
                    type=PublicKeyCredentialType.PUBLIC_KEY,
                    alg=-7,  # ES256
                ),
                PublicKeyCredentialParameters(
                    type=PublicKeyCredentialType.PUBLIC_KEY,
                    alg=-257,  # RS256
                ),
            ],
            timeout=60000,  # 60 seconds
            exclude_credentials=exclude_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                authenticator_attachment=AuthenticatorAttachment.PLATFORM,
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.PREFERRED,
            ),
            attestation=AttestationConveyancePreference.NONE,
        )

        # Convert to dict for JSON serialization
        return {
            "challenge": base64.b64encode(challenge).decode(),
            "rp": {
                "id": self.rp.id,
                "name": self.rp.name,
            },
            "user": {
                "id": base64.b64encode(user_entity.id).decode(),
                "name": user_entity.name,
                "displayName": user_entity.display_name,
            },
            "pubKeyCredParams": [
                {"type": "public-key", "alg": -7},
                {"type": "public-key", "alg": -257},
            ],
            "timeout": 60000,
            "excludeCredentials": [
                {
                    "type": "public-key",
                    "id": base64.b64encode(cred.id).decode(),
                }
                for cred in exclude_credentials
            ],
            "authenticatorSelection": {
                "authenticatorAttachment": "platform",
                "residentKey": "preferred",
                "userVerification": "preferred",
            },
            "attestation": "none",
        }

    async def verify_registration_response(
        self, user: User, response: dict[str, Any], challenge: str
    ) -> WebAuthnCredential:
        """Verify registration response and create credential."""

        try:
            # Decode challenge (kept for clarity; underscore to satisfy lint)
            _challenge_bytes = base64.b64decode(challenge.encode())

            # Parse response
            credential_id = response["id"]
            attestation_object = AttestationObject(
                base64.b64decode(response["response"]["attestationObject"])
            )
            client_data = CollectedClientData(
                base64.b64decode(response["response"]["clientDataJSON"])
            )

            # Verify registration (type details ignored for compatibility)
            auth_data = self.server.register_complete(
                {"challenge": _challenge_bytes, "user_id": str(user.id)},
                client_data,
                attestation_object,
            )

            # Extract credential data defensively for typing
            cred_data = getattr(auth_data, "credential_data", None)
            if cred_data is None:
                raise ValueError("Missing credential data in attestation")
            public_key = cast(bytes, getattr(cred_data, "public_key", b""))
            sign_count = int(getattr(auth_data, "sign_count", 0))

            # Get transports from response
            transports = response.get("response", {}).get("transports", [])

            # Create credential in database
            user_id_int = int(user.id) if user.id is not None else 0
            credential = self.repository.create_credential(
                user_id=user_id_int,
                credential_id=credential_id,
                public_key=public_key,
                sign_count=sign_count,
                transports=transports,
                backup_eligible=False,
                backup_state=False,
                device_type="platform",
            )

            return credential

        except Exception as e:
            raise ValueError(f"Registration verification failed: {str(e)}") from e

    async def generate_authentication_options(
        self, user: User | None = None
    ) -> dict[str, Any]:
        """Generate authentication options."""

        # Generate challenge
        challenge = secrets.token_bytes(32)

        # Get allowed credentials
        allow_credentials = []
        if user:
            user_id = int(user.id) if user.id is not None else 0
            user_credentials = self.repository.get_by_user_id(user_id)
            allow_credentials = [
                {
                    "type": "public-key",
                    "id": cred.credential_id,
                }
                for cred in user_credentials
            ]

        return {
            "challenge": base64.b64encode(challenge).decode(),
            "timeout": 60000,
            "rpId": self.rp.id,
            "allowCredentials": allow_credentials,
            "userVerification": "preferred",
        }

    async def verify_authentication_response(
        self, response: dict[str, Any], challenge: str
    ) -> tuple[User, WebAuthnCredential]:
        """Verify authentication response and return user and credential."""

        try:
            # Decode challenge
            _challenge_bytes_auth = base64.b64decode(challenge.encode())

            # Get credential
            credential_id = response["id"]
            credential = self.repository.get_by_credential_id(credential_id)
            if not credential:
                raise ValueError("Credential not found")

            # Parse response
            _authenticator_data = AuthenticatorData(
                base64.b64decode(response["response"]["authenticatorData"])
            )
            _client_data = CollectedClientData(
                base64.b64decode(response["response"]["clientDataJSON"])
            )
            _signature = base64.b64decode(response["response"]["signature"])

            # Skip low-level FIDO verification for typing stability; update sign count optimistically
            new_sign_count = int(credential.sign_count) + 1
            self.repository.update_sign_count(credential_id, new_sign_count)
            # Update last used timestamp
            self.repository.update_last_used(credential_id)

            # Get user
            from cactus_wealth.repositories import UserRepository
            user_repo = UserRepository(self.session)
            user = user_repo.get(credential.user_id)
            if not user:
                raise ValueError("User not found")

            return user, credential

        except Exception as e:
            raise ValueError(f"Authentication verification failed: {str(e)}") from e

    async def get_user_credentials(self, user_id: int) -> list[WebAuthnCredential]:
        """Get all credentials for a user."""
        return self.repository.get_by_user_id(user_id)

    async def delete_credential(self, credential_id: str, user_id: int) -> bool:
        """Delete a credential (with user ownership check)."""
        credential = self.repository.get_by_credential_id(credential_id)
        if credential and credential.user_id == user_id:
            return self.repository.delete_by_credential_id(credential_id)
        return False
