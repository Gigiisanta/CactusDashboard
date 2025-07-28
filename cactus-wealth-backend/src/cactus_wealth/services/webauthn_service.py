# file: /Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/services/webauthn_service.py
"""
WebAuthn service for Passkey authentication operations.
"""

import base64
import json
import secrets
from typing import Any, Dict, List, Optional

from cactus_wealth.core.config import settings
from cactus_wealth.models import User, WebAuthnCredential
from cactus_wealth.repositories.webauthn_repository import WebAuthnCredentialRepository
from cactus_wealth.schemas import (
    AuthenticationOptionsResponse,
    RegistrationOptionsResponse,
)
from fido2.server import Fido2Server
from fido2.webauthn import (
    AttestationConveyancePreference,
    AuthenticatorAttachment,
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialParameters,
    PublicKeyCredentialRequestOptions,
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialType,
    PublicKeyCredentialUserEntity,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from fido2.webauthn import AttestationObject, AuthenticatorData, CollectedClientData
from sqlmodel import Session


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
            f"http://localhost:3000",  # Development
            f"http://127.0.0.1:3000",  # Development
        ]
        return origin in allowed_origins

    async def generate_registration_options(
        self, user: User, exclude_existing: bool = True
    ) -> Dict[str, Any]:
        """Generate registration options for a user."""
        
        # Get existing credentials to exclude
        exclude_credentials = []
        if exclude_existing:
            existing_creds = await self.repository.get_by_user_id(user.id)
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
        options = PublicKeyCredentialCreationOptions(
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
        self, user: User, response: Dict[str, Any], challenge: str
    ) -> WebAuthnCredential:
        """Verify registration response and create credential."""
        
        try:
            # Decode challenge
            challenge_bytes = base64.b64decode(challenge.encode())
            
            # Parse response
            credential_id = response["id"]
            attestation_object = AttestationObject(
                base64.b64decode(response["response"]["attestationObject"])
            )
            client_data = CollectedClientData(
                base64.b64decode(response["response"]["clientDataJSON"])
            )
            
            # Verify registration
            auth_data = self.server.register_complete(
                session={"challenge": challenge_bytes, "user_id": str(user.id)},
                client_data=client_data,
                attestation_object=attestation_object,
            )
            
            # Extract credential data
            public_key = auth_data.credential_data.public_key
            sign_count = auth_data.sign_count
            
            # Get transports from response
            transports = response.get("response", {}).get("transports", [])
            
            # Create credential in database
            credential = await self.repository.create_credential(
                user_id=user.id,
                credential_id=credential_id,
                public_key=public_key,
                sign_count=sign_count,
                transports=transports,
                backup_eligible=auth_data.flags.backup_eligible,
                backup_state=auth_data.flags.backup_state,
                device_type="platform",  # Assuming platform authenticator
            )
            
            return credential
            
        except Exception as e:
            raise ValueError(f"Registration verification failed: {str(e)}")

    async def generate_authentication_options(
        self, user: Optional[User] = None
    ) -> Dict[str, Any]:
        """Generate authentication options."""
        
        # Generate challenge
        challenge = secrets.token_bytes(32)
        
        # Get allowed credentials
        allow_credentials = []
        if user:
            user_credentials = await self.repository.get_by_user_id(user.id)
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
        self, response: Dict[str, Any], challenge: str
    ) -> tuple[User, WebAuthnCredential]:
        """Verify authentication response and return user and credential."""
        
        try:
            # Decode challenge
            challenge_bytes = base64.b64decode(challenge.encode())
            
            # Get credential
            credential_id = response["id"]
            credential = await self.repository.get_by_credential_id(credential_id)
            if not credential:
                raise ValueError("Credential not found")
            
            # Parse response
            authenticator_data = AuthenticatorData(
                base64.b64decode(response["response"]["authenticatorData"])
            )
            client_data = CollectedClientData(
                base64.b64decode(response["response"]["clientDataJSON"])
            )
            signature = base64.b64decode(response["response"]["signature"])
            
            # Verify authentication
            self.server.authenticate_complete(
                session={
                    "challenge": challenge_bytes,
                    "user_id": str(credential.user_id),
                },
                credentials=[credential.public_key],
                credential_id=base64.b64decode(credential_id),
                client_data=client_data,
                auth_data=authenticator_data,
                signature=signature,
            )
            
            # Update sign count
            new_sign_count = authenticator_data.sign_count
            if new_sign_count <= credential.sign_count:
                raise ValueError("Invalid sign count - possible cloned authenticator")
            
            await self.repository.update_sign_count(credential_id, new_sign_count)
            
            # Get user
            from cactus_wealth.repositories import UserRepository
            user_repo = UserRepository(self.session)
            user = user_repo.get_user_by_id(credential.user_id)
            if not user:
                raise ValueError("User not found")
            
            return user, credential
            
        except Exception as e:
            raise ValueError(f"Authentication verification failed: {str(e)}")

    async def get_user_credentials(self, user_id: int) -> List[WebAuthnCredential]:
        """Get all credentials for a user."""
        return await self.repository.get_by_user_id(user_id)

    async def delete_credential(self, credential_id: str, user_id: int) -> bool:
        """Delete a credential (with user ownership check)."""
        credential = await self.repository.get_by_credential_id(credential_id)
        if credential and credential.user_id == user_id:
            return await self.repository.delete_by_credential_id(credential_id)
        return False