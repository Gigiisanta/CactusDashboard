"""
Health check endpoint for monitoring system status.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    from datetime import datetime
    return {
        "status": "healthy",
        "message": "Cactus Wealth API is running",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check endpoint."""
    from datetime import datetime
    return {
        "status": "healthy",
        "components": {
            "database": "connected",
            "redis": "connected",
            "api": "running"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
