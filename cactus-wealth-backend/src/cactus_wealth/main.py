"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cactus_wealth.api.v1.api import api_router
from cactus_wealth.core.config import settings
# from cactus_wealth.core.middleware import (
#     LoggingMiddleware,
#     SecurityHeadersMiddleware,
#     PerformanceMiddleware,
# )

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cactus Wealth Management API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
# app.add_middleware(LoggingMiddleware)
# app.add_middleware(SecurityHeadersMiddleware)
# app.add_middleware(PerformanceMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Cactus Wealth Management API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "cactus-wealth-backend"}