"""
Traditional login endpoint for username/password authentication, compatible with
OAuth2PasswordRequestForm. This module is included under the prefix `/auth/login`,
so the final path for obtaining an access token is `/api/v1/auth/login/access-token`.
"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from .....core.config import settings
from .....database import get_session
from .....schemas import Token
from .....security import authenticate_user, create_access_token
import logging

router = APIRouter()


@router.post("/access-token", response_model=Token)
async def login_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
) -> Token:
    """Issue JWT access token using username/email and password."""
    logging.info(
        f"[DEBUG LOGIN] content-type={request.headers.get('content-type')} username={form_data.username}"
    )

    user = authenticate_user(
        session=session,
        username=form_data.username,
        password=form_data.password,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")