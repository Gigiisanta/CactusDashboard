"""
Middleware functions for the Cactus Wealth API.
"""

import time
from collections.abc import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()


async def add_security_headers(request: Request, call_next: Callable) -> Response:
    """Add security headers to all responses."""
    response = await call_next(request)

    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    return response


async def log_request(request: Request, call_next: Callable) -> Response:
    """Log incoming requests for debugging."""
    start_time = time.time()

    # Log request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
    )

    response = await call_next(request)

    # Log response
    process_time = time.time() - start_time
    logger.info(
        "Request completed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=f"{process_time:.4f}s",
    )

    return response


async def performance_middleware(request: Request, call_next: Callable) -> Response:
    """Performance monitoring middleware."""
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    # Log slow requests
    if process_time > 1.0:  # Log requests taking more than 1 second
        logger.warning(
            "Slow request detected",
            method=request.method,
            url=str(request.url),
            process_time=f"{process_time:.4f}s",
        )

    # Add performance header
    response.headers["X-Process-Time"] = f"{process_time:.4f}"

    return response


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"

        return response
