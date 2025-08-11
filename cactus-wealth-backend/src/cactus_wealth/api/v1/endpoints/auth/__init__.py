"""
Authentication endpoints module.

This module consolidates all authentication-related endpoints:
- Login (traditional username/password)
- Hybrid authentication (Google OAuth + Passkeys via NextAuth)
- Passkeys/WebAuthn
"""

from fastapi import APIRouter

# Import passkeys module via the endpoints package to align with tests that patch
from cactus_wealth.api.v1.endpoints import passkeys  # type: ignore

from . import hybrid, login

# Create the main auth router
auth_router = APIRouter()

# Include all authentication sub-routers
auth_router.include_router(login.router, prefix="/login", tags=["login"])
auth_router.include_router(passkeys.router, prefix="/passkeys", tags=["passkeys"])
auth_router.include_router(hybrid.router, prefix="/hybrid", tags=["hybrid-auth"])

__all__ = ["auth_router"]
