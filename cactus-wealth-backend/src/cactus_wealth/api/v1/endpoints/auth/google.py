"""
Google OAuth authentication endpoints.
"""

import logging
from datetime import timedelta
from typing import Dict, Any

import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session

from cactus_wealth.core.config import settings
from cactus_wealth.database import get_session
from cactus_wealth.repositories import UserRepository
from cactus_wealth.schemas import Token, UserCreate, GoogleAuthResponse, GoogleUser
from cactus_wealth.security import create_access_token
from cactus_wealth.models import User, UserRole

router = APIRouter()
logger = logging.getLogger(__name__)


from pydantic import BaseModel
from typing import Optional

class GoogleTokenRequest(BaseModel):
    id_token: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None

@router.post("/google/verify", response_model=GoogleAuthResponse)
async def verify_google_token(
    request: GoogleTokenRequest,
    session: Session = Depends(get_session),
) -> GoogleAuthResponse:
    """
    Verify Google OAuth token and create/login user.
    Supports both id_token (from Google Sign-In) and code (from OAuth flow).
    """
    # Debug logging
    print(f"DEBUG: Received Google auth request: id_token={bool(request.id_token)}, code={bool(request.code)}, redirect_uri={request.redirect_uri}")
    logger.info(f"Received Google auth request: id_token={bool(request.id_token)}, code={bool(request.code)}, redirect_uri={request.redirect_uri}")
    
    # Handle id_token flow (Google Sign-In)
    id_token = request.id_token
    # Handle authorization code flow
    auth_code = request.code
    redirect_uri = request.redirect_uri
    
    if not id_token and not auth_code:
        logger.error(f"Missing required parameters: id_token={id_token}, code={auth_code}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either id_token or code is required"
        )

    try:
        if id_token:
            # Verify ID token directly
            user_info = await verify_google_id_token(id_token)
        else:
            # Exchange authorization code for tokens
            user_info = await exchange_code_for_user_info(auth_code, redirect_uri)
        
        user_repo = UserRepository(session)
        
        # Check if user exists
        existing_user = user_repo.get_user_by_email(email=user_info["email"])
        
        if existing_user:
            # User exists, log them in
            user = existing_user
            logger.info(f"Existing user logged in via Google OAuth: {user.email}")
            
            # Update existing user with Google OAuth data if not already set
            if not hasattr(user, 'google_id') or not user.google_id:
                user.google_id = user_info.get("id")
                user.auth_provider = "google"
                session.commit()
                session.refresh(user)
        else:
            # Create new user with unique username
            base_username = user_info["email"].split("@")[0]
            username = base_username
            counter = 1
            
            # Ensure username is unique
            while user_repo.get_user_by_username(username=username):
                username = f"{base_username}_{counter}"
                counter += 1
            
            user_create = UserCreate(
                username=username,
                email=user_info["email"],
                password="google_oauth_user",  # Placeholder password for OAuth users
                role=UserRole.JUNIOR_ADVISOR,  # Default role for new Google OAuth users
                is_active=True
            )
            
            try:
                user = user_repo.create_user(user_create=user_create)
                logger.info(f"New user created via Google OAuth: {user.email} with username: {user.username}")
                
                # Update with Google OAuth specific fields
                user.google_id = user_info.get("id")
                user.auth_provider = "google"
                session.commit()
                session.refresh(user)
                
            except ValueError as ve:
                logger.error(f"User creation failed: {str(ve)}")
                # If user creation fails due to duplicate, try to get existing user again
                existing_user = user_repo.get_user_by_email(email=user_info["email"])
                if existing_user:
                    user = existing_user
                    logger.info(f"Found existing user after creation failure: {user.email}")
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create or retrieve user"
                    )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires,
        )
        
        # Create GoogleUser object
        google_user = GoogleUser(
            id=user_info.get("id", str(user.id)),  # Use Google ID if available, otherwise user ID
            email=user.email,
            name=user_info.get("name", user.username),
            picture=user_info.get("picture", "")
        )
        
        logger.info(f"Google OAuth authentication successful for user: {user.email}")
        return GoogleAuthResponse(access_token=access_token, user=google_user)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Google OAuth verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )


async def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verify Google ID token and return user information.
    """
    print(f"DEBUG: Verifying Google ID token: {id_token[:50]}...")
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={id_token}"
        )
        
        print(f"DEBUG: Google tokeninfo response status: {response.status_code}")
        print(f"DEBUG: Google tokeninfo response: {response.text[:200]}...")
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google ID token"
            )
        
        token_info = response.json()
        
        print(f"DEBUG: Token info keys: {list(token_info.keys())}")
        print(f"DEBUG: Token audience: {token_info.get('aud')}")
        print(f"DEBUG: Expected audience: {settings.GOOGLE_CLIENT_ID}")
        
        # Validate required fields and audience
        if not token_info.get("email") or not token_info.get("email_verified"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified with Google"
            )
            
        if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience"
            )
        
        return {
            "email": token_info["email"],
            "verified_email": token_info.get("email_verified", False),
            "name": token_info.get("name", ""),
            "picture": token_info.get("picture", "")
        }


async def exchange_code_for_user_info(code: str, redirect_uri: str) -> Dict[str, Any]:
    """
    Exchange authorization code for access token and get user info.
    """
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
            }
        )
        
        if token_response.status_code != 200:
            logger.error(f"Token exchange failed: {token_response.text}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to exchange authorization code"
            )
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token received"
            )
        
        # Get user info using access token
        user_response = await client.get(
            f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={access_token}"
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user information"
            )
        
        user_info = user_response.json()
        
        # Validate required fields
        if not user_info.get("email") or not user_info.get("verified_email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified with Google"
            )
        
        return user_info


async def verify_google_oauth_token(token: str) -> Dict[str, Any]:
    """
    Legacy function - kept for backward compatibility.
    Verify Google OAuth token and return user information.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
        
        user_info = response.json()
        
        # Validate required fields
        if not user_info.get("email") or not user_info.get("verified_email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified with Google"
            )
        
        return user_info


@router.get("/google/config")
async def get_google_config():
    """
    Get Google OAuth configuration for frontend.
    """
    return {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI
    }