"""
API v1 endpoints package. Re-export modules needed for tests that import by attribute.
"""

# Ensure passkeys module is importable as cactus_wealth.api.v1.endpoints.passkeys
from .auth import passkeys as passkeys  # noqa: F401


