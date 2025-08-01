"""
Hybrid authentication endpoints for combining Google OAuth with Passkeys.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ....database import get_session
from ....security import get_current_user
from ....models import User, WebAuthnCredential
from ....schemas import UserRead, GoogleAuthResponse, GoogleUser
from ....repositories import UserRepository
from ....services.webauthn_service import WebAuthnService
from ....security import create_access_token
from ....core.config import settings
from datetime import timedelta

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/user/auth-methods")
async def get_user_auth_methods(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Get available authentication methods for the current user.
    """
    # Check if user has passkeys
    passkey_credentials = session.query(WebAuthnCredential).filter(
        WebAuthnCredential.user_id == current_user.id
    ).all()
    
    has_passkeys = len(passkey_credentials) > 0
    has_google_auth = current_user.google_id is not None
    
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "auth_provider": current_user.auth_provider,
        "has_google_auth": has_google_auth,
        "has_passkeys": has_passkeys,
        "passkey_count": len(passkey_credentials),
        "can_use_biometric": has_google_auth and has_passkeys,
        "google_id": current_user.google_id
    }


@router.post("/passkey/authenticate-google-user")
async def authenticate_google_user_with_passkey(
    email: str,
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Check if a Google user can authenticate with passkey and return authentication options.
    """
    # Find user by email
    user_repo = UserRepository(session)
    user = user_repo.get_by_email(email=email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user has Google OAuth enabled
    if not user.google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have Google OAuth enabled"
        )
    
    # Check if user has passkeys
    passkey_credentials = session.query(WebAuthnCredential).filter(
        WebAuthnCredential.user_id == user.id
    ).all()
    
    if not passkey_credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have passkeys configured"
        )
    
    # Generate authentication options
    try:
        webauthn_service = WebAuthnService(session)
        options = webauthn_service.generate_authentication_options(
            user_id=str(user.id),
            user_credentials=[
                {
                    "id": cred.credential_id,
                    "public_key": cred.public_key,
                    "sign_count": cred.sign_count,
                    "transports": cred.transports.split(",") if cred.transports else []
                }
                for cred in passkey_credentials
            ]
        )
        
        return {
            "user_id": user.id,
            "email": user.email,
            "options": options,
            "can_authenticate": True
        }
        
    except Exception as e:
        logger.error(f"Error generating authentication options: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication options"
        )


@router.post("/passkey/verify-google-user", response_model=GoogleAuthResponse)
async def verify_google_user_passkey(
    credential_data: Dict[str, Any],
    session: Session = Depends(get_session)
) -> GoogleAuthResponse:
    """
    Verify passkey authentication for a Google OAuth user and return access token.
    """
    try:
        # Extract user ID from credential data
        user_id = credential_data.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID is required"
            )
        
        # Get user
        user_repo = UserRepository(session)
        user = user_repo.get_by_id(user_id=int(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify that user has Google OAuth enabled
        if not user.google_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have Google OAuth enabled"
            )
        
        # Get user's passkey credentials
        passkey_credentials = session.query(WebAuthnCredential).filter(
            WebAuthnCredential.user_id == user.id
        ).all()
        
        if not passkey_credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have passkeys configured"
            )
        
        # Verify the passkey authentication
        webauthn_service = WebAuthnService(session)
        verification_result = webauthn_service.verify_authentication(
            credential_data=credential_data,
            user_credentials=[
                {
                    "id": cred.credential_id,
                    "public_key": cred.public_key,
                    "sign_count": cred.sign_count
                }
                for cred in passkey_credentials
            ]
        )
        
        if not verification_result.get("verified", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Passkey authentication failed"
            )
        
        # Update sign count for the used credential
        credential_id = verification_result.get("credential_id")
        if credential_id:
            for cred in passkey_credentials:
                if cred.credential_id == credential_id:
                    cred.sign_count = verification_result.get("new_sign_count", cred.sign_count)
                    cred.last_used_at = datetime.utcnow()
                    session.commit()
                    break
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires,
        )
        
        # Create GoogleUser object
        google_user = GoogleUser(
            id=user.google_id,
            email=user.email,
            name=user.username,
            picture=""  # Could be stored in user profile if needed
        )
        
        logger.info(f"Google user authenticated with passkey: {user.email}")
        return GoogleAuthResponse(access_token=access_token, user=google_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Passkey verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Passkey verification failed"
        )


@router.post("/link-passkey-to-google")
async def link_passkey_to_google_account(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Generate registration options for linking a passkey to a Google OAuth account.
    """
    # Verify user has Google OAuth enabled
    if not current_user.google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have Google OAuth enabled"
        )
    
    try:
        # Get existing credentials for this user
        existing_credentials = session.query(WebAuthnCredential).filter(
            WebAuthnCredential.user_id == current_user.id
        ).all()
        
        # Generate registration options
        webauthn_service = WebAuthnService(session)
        options = webauthn_service.generate_registration_options(
            user_id=str(current_user.id),
            username=current_user.username,
            display_name=current_user.email,
            existing_credentials=[
                {
                    "id": cred.credential_id,
                    "transports": cred.transports.split(",") if cred.transports else []
                }
                for cred in existing_credentials
            ]
        )
        
        return {
            "options": options,
            "user_id": current_user.id,
            "message": "Passkey registration options generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating passkey registration options: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate passkey registration options"
        )


@router.get("/google-users-with-passkeys")
async def get_google_users_with_passkeys(
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Get list of users who have both Google OAuth and passkeys enabled.
    This endpoint can be used by the frontend to show biometric login options.
    """
    # Query users with Google OAuth
    google_users = session.query(User).filter(
        User.google_id.isnot(None),
        User.is_active == True
    ).all()
    
    users_with_passkeys = []
    
    for user in google_users:
        # Check if user has passkeys
        passkey_count = session.query(WebAuthnCredential).filter(
            WebAuthnCredential.user_id == user.id
        ).count()
        
        if passkey_count > 0:
            users_with_passkeys.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "passkey_count": passkey_count,
                "can_use_biometric": True
            })
    
    return {
        "users": users_with_passkeys,
        "total_count": len(users_with_passkeys),
        "message": f"Found {len(users_with_passkeys)} users with both Google OAuth and passkeys"
    }