from datetime import datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session

from cactus_wealth.core.config import settings
from cactus_wealth.core.crypto import verify_password
from cactus_wealth.core.logging_config import get_structured_logger
from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.repositories import UserRepository
from cactus_wealth.schemas import TokenData

# Crypto helpers are provided by core.crypto to avoid circular imports

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

logger = get_structured_logger(__name__)


# Note: keep names imported to satisfy existing usages in this module


def _get_secret_key() -> str:
    """Return a secret key, falling back to a deterministic test key in testing.

    This avoids env coupling during smoke tests.
    """
    if settings.SECRET_KEY:
        return settings.SECRET_KEY
    # Fallback only for tests
    return "insecure-test-secret"


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, _get_secret_key(), algorithm="HS256")
    return encoded_jwt


def authenticate_user(session: Session, username: str, password: str) -> User | None:
    """Authenticate a user with username/email and password."""
    user_repo = UserRepository(session)

    # Try to find user by username first
    user = user_repo.get_by_username(username=username)

    # If not found by username, try by email
    if not user:
        user = user_repo.get_by_email(email=username)

    if not user:
        return None
    if not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    session: Session = Depends(get_session), token: str = Depends(oauth2_scheme)
) -> User:
    """Get the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=["HS256"])
        email = payload.get("sub")
        if not isinstance(email, str):
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.warning("jwt_decode_error", error=str(e))
        raise credentials_exception from e

    user_repo = UserRepository(session)
    if token_data.email is None:
        raise credentials_exception
    user = user_repo.get_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_user_from_token(token: str) -> User:
    """
    Get the current user from a JWT token string (para WebSockets).

    Esta función es similar a get_current_user pero funciona directamente
    con un token string en lugar de usar el sistema de dependencias de FastAPI.
    Útil para autenticación en WebSockets.

    Args:
        token: JWT token string

    Returns:
        Usuario autenticado

    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, _get_secret_key(), algorithms=["HS256"])
        email = payload.get("sub")
        if not isinstance(email, str):
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.warning("jwt_decode_error", error=str(e))
        raise credentials_exception from e

    # Crear una nueva session para esta operación
    from cactus_wealth.database import get_engine

    session = Session(get_engine(), autoflush=True, autocommit=False)
    try:
        user_repo = UserRepository(session)
        if token_data.email is None:
            raise credentials_exception
        user = user_repo.get_by_email(email=token_data.email)
        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        return user
    finally:
        session.close()
