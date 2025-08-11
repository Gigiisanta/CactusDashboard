"""
Standalone cryptographic helpers to avoid circular imports.

These utilities must not import from application layers like repositories
or API modules. They are safe to use anywhere in the codebase.
"""

from __future__ import annotations

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a stored hash.

    Returns False on any verification error to avoid raising during auth flows.
    """
    try:
        return _pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate a password hash using the configured algorithm."""
    return _pwd_context.hash(password)


