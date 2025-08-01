# file: /Users/prueba/Desktop/CactusDashboard/cactus-wealth-backend/src/cactus_wealth/api/v1/endpoints/passkeys.py
"""
WebAuthn/Passkey authentication endpoints.
"""

import json
from datetime import timedelta
from typing import Any, Dict

from ...core.config import settings
from ...database import get_session
from ...models import User
from ...schemas import Token
from ...schemas import (
    AuthenticationOptionsRequest,
    AuthenticationOptionsResponse,
    AuthenticationVerificationRequest,
    CredentialRead,
    PasskeyLoginResponse,
    RegistrationOptionsRequest,
    RegistrationOptionsResponse,
    RegistrationVerificationRequest,
)
from ...security import create_access_token, get_current_user
from ...services.webauthn_service import WebAuthnService
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlmodel import Session
import structlog

logger = structlog.get_logger()

router = APIRouter()


class DetailedHTTPException(HTTPException):
    """Enhanced HTTP exception with detailed error information."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        error_type: str = "validation_error",
        **kwargs
    ):
        super().__init__(status_code=status_code, detail=detail, **kwargs)
        self.error_code = error_code
        self.error_type = error_type


# In-memory storage for challenges (in production, use Redis)
_challenges: Dict[str, Dict[str, Any]] = {}


@router.post("/register/options", response_model=Dict[str, Any])
async def get_registration_options(
    request: RegistrationOptionsRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Generate WebAuthn registration options for the current user."""
    try:
        webauthn_service = WebAuthnService(session)
        options = await webauthn_service.generate_registration_options(current_user)
        
        # Store challenge for verification
        challenge_key = f"reg_{current_user.id}_{options['challenge']}"
        _challenges[challenge_key] = {
            "challenge": options["challenge"],
            "user_id": current_user.id,
            "type": "registration",
        }
        
        logger.info(
            "Generated registration options",
            user_id=current_user.id,
            challenge=options["challenge"][:10] + "...",
        )
        
        return options
        
    except Exception as e:
        logger.error("Failed to generate registration options", error=str(e), user_id=current_user.id)
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate registration options",
            error_code="REGISTRATION_OPTIONS_FAILED",
        )


@router.post("/register", response_model=CredentialRead)
async def register_passkey(
    request: RegistrationVerificationRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CredentialRead:
    """Verify WebAuthn registration and create credential."""
    try:
        webauthn_service = WebAuthnService(session)
        
        # Find and validate challenge
        challenge_key = None
        challenge_data = None
        for key, data in _challenges.items():
            if (
                key.startswith(f"reg_{current_user.id}_")
                and data["type"] == "registration"
                and data["user_id"] == current_user.id
            ):
                challenge_key = key
                challenge_data = data
                break
        
        if not challenge_data:
            raise DetailedHTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired challenge",
                error_code="INVALID_CHALLENGE",
            )
        
        # Prepare response data
        response_data = {
            "id": request.credential_id,
            "response": {
                "attestationObject": request.attestation_object,
                "clientDataJSON": request.client_data_json,
                "transports": request.transports or [],
            },
        }
        
        # Verify registration
        credential = await webauthn_service.verify_registration_response(
            current_user, response_data, challenge_data["challenge"]
        )
        
        # Clean up challenge
        if challenge_key:
            del _challenges[challenge_key]
        
        logger.info(
            "Passkey registered successfully",
            user_id=current_user.id,
            credential_id=credential.credential_id,
        )
        
        # Convert to response format
        return CredentialRead(
            id=credential.id,
            user_id=credential.user_id,
            credential_id=credential.credential_id,
            sign_count=credential.sign_count,
            transports=json.loads(credential.transports) if credential.transports else None,
            aaguid=credential.aaguid,
            backup_eligible=credential.backup_eligible,
            backup_state=credential.backup_state,
            device_type=credential.device_type,
            created_at=credential.created_at,
            last_used_at=credential.last_used_at,
        )
        
    except ValueError as e:
        logger.error("Registration verification failed", error=str(e), user_id=current_user.id)
        raise DetailedHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
            error_code="REGISTRATION_VERIFICATION_FAILED",
        )
    except Exception as e:
        logger.error("Unexpected error during registration", error=str(e), user_id=current_user.id)
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
            error_code="REGISTRATION_FAILED",
        )


@router.post("/login/options", response_model=Dict[str, Any])
async def get_authentication_options(
    request: AuthenticationOptionsRequest,
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Generate WebAuthn authentication options."""
    try:
        webauthn_service = WebAuthnService(session)
        
        # For usernameless authentication, pass None
        user = None
        if request.username:
            from ...repositories import UserRepository
            user_repo = UserRepository(session)
            user = user_repo.get_user_by_username(request.username)
            if not user:
                raise DetailedHTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found",
                    error_code="USER_NOT_FOUND",
                )
        
        options = await webauthn_service.generate_authentication_options(user)
        
        # Store challenge for verification
        challenge_key = f"auth_{options['challenge']}"
        _challenges[challenge_key] = {
            "challenge": options["challenge"],
            "user_id": user.id if user else None,
            "type": "authentication",
        }
        
        logger.info(
            "Generated authentication options",
            username=request.username,
            challenge=options["challenge"][:10] + "...",
        )
        
        return options
        
    except DetailedHTTPException:
        raise
    except Exception as e:
        logger.error("Failed to generate authentication options", error=str(e))
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication options",
            error_code="AUTHENTICATION_OPTIONS_FAILED",
        )


@router.post("/login", response_model=Token)
async def login_with_passkey(
    request: AuthenticationVerificationRequest,
    session: Session = Depends(get_session),
) -> Token:
    """Verify WebAuthn authentication and return access token."""
    try:
        webauthn_service = WebAuthnService(session)
        
        # Find and validate challenge
        challenge_key = None
        challenge_data = None
        for key, data in _challenges.items():
            if key.startswith("auth_") and data["type"] == "authentication":
                challenge_key = key
                challenge_data = data
                break
        
        if not challenge_data:
            raise DetailedHTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired challenge",
                error_code="INVALID_CHALLENGE",
            )
        
        # Prepare response data
        response_data = {
            "id": request.credential_id,
            "response": {
                "authenticatorData": request.authenticator_data,
                "clientDataJSON": request.client_data_json,
                "signature": request.signature,
                "userHandle": request.user_handle,
            },
        }
        
        # Verify authentication
        user, credential = await webauthn_service.verify_authentication_response(
            response_data, challenge_data["challenge"]
        )
        
        # Clean up challenge
        if challenge_key:
            del _challenges[challenge_key]
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires,
        )
        
        logger.info(
            "Passkey authentication successful",
            user_id=user.id,
            credential_id=credential.credential_id,
        )
        
        return Token(access_token=access_token, token_type="bearer")
        
    except ValueError as e:
        logger.error("Authentication verification failed", error=str(e))
        raise DetailedHTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            error_code="AUTHENTICATION_VERIFICATION_FAILED",
        )
    except Exception as e:
        logger.error("Unexpected error during authentication", error=str(e))
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed",
            error_code="AUTHENTICATION_FAILED",
        )


@router.get("/credentials", response_model=list[CredentialRead])
async def get_user_credentials(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[CredentialRead]:
    """Get all WebAuthn credentials for the current user."""
    try:
        webauthn_service = WebAuthnService(session)
        credentials = await webauthn_service.get_user_credentials(current_user.id)
        
        return [
            CredentialRead(
                id=cred.id,
                user_id=cred.user_id,
                credential_id=cred.credential_id,
                sign_count=cred.sign_count,
                transports=json.loads(cred.transports) if cred.transports else None,
                aaguid=cred.aaguid,
                backup_eligible=cred.backup_eligible,
                backup_state=cred.backup_state,
                device_type=cred.device_type,
                created_at=cred.created_at,
                last_used_at=cred.last_used_at,
            )
            for cred in credentials
        ]
        
    except Exception as e:
        logger.error("Failed to get user credentials", error=str(e), user_id=current_user.id)
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get credentials",
            error_code="GET_CREDENTIALS_FAILED",
        )


@router.delete("/credentials/{credential_id}")
async def delete_credential(
    credential_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> JSONResponse:
    """Delete a WebAuthn credential."""
    try:
        webauthn_service = WebAuthnService(session)
        success = await webauthn_service.delete_credential(credential_id, current_user.id)
        
        if not success:
            raise DetailedHTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found or not owned by user",
                error_code="CREDENTIAL_NOT_FOUND",
            )
        
        logger.info(
            "Credential deleted successfully",
            user_id=current_user.id,
            credential_id=credential_id,
        )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Credential deleted successfully"},
        )
        
    except DetailedHTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete credential", error=str(e), user_id=current_user.id)
        raise DetailedHTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete credential",
            error_code="DELETE_CREDENTIAL_FAILED",
        )