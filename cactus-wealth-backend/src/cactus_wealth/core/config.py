"""
Configuration settings for the Cactus Wealth application.
"""

import os

from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Basic app settings
    PROJECT_NAME: str = "Cactus Wealth"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    TESTING: bool = bool(os.getenv("TESTING", "0") == "1")

    # API settings
    API_V1_STR: str = "/api/v1"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000", "http://localhost:8080"]

    # Database settings
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://cactus_user:cactus_pass@db:5432/cactus_wealth"
    )

    # Redis settings for caching
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_TTL: int = 300  # 5 minutes default TTL

    # Security settings
    # Must be provided via environment in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CREATE_TABLES_ON_STARTUP: bool = bool(os.getenv("CREATE_TABLES_ON_STARTUP", "0") == "1")

    # Google OAuth settings - DEPRECATED: Now handled by NextAuth in frontend
    # GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    # GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    # GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

    # WebAuthn/FIDO2 settings
    WEBAUTHN_RP_ID: str = os.getenv("WEBAUTHN_RP_ID", "localhost")
    WEBAUTHN_RP_NAME: str = os.getenv("WEBAUTHN_RP_NAME", "Cactus Wealth")
    WEBAUTHN_ORIGIN: str = os.getenv("WEBAUTHN_ORIGIN", "http://localhost:3000")

    # Frontend / NextAuth integration
    NEXTAUTH_URL: str = os.getenv("NEXTAUTH_URL", "http://localhost:3000")

    # Email / SMTP settings
    EMAIL_SERVER_HOST: str = os.getenv("EMAIL_SERVER_HOST", "")
    EMAIL_SERVER_PORT: int = int(os.getenv("EMAIL_SERVER_PORT", "587"))
    EMAIL_SERVER_USER: str = os.getenv("EMAIL_SERVER_USER", "")
    EMAIL_SERVER_PASS: str = os.getenv("EMAIL_SERVER_PASS", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "")

    # Performance settings
    MAX_CONNECTIONS: int = 20
    CONNECTION_TIMEOUT: int = 10
    REQUEST_TIMEOUT: int = 30

    # E2E testing settings
    E2E_MODE: bool = bool(os.getenv("E2E_MODE", "0") == "1")
    E2E_SECRET: str = os.getenv("E2E_SECRET", "")

    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # CORS settings
    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list | str):
            return v
        raise ValueError(v)

    # Database optimization settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True

    # PostgreSQL specific settings
    POSTGRES_SHARED_BUFFERS: str = "256MB"
    POSTGRES_EFFECTIVE_CACHE_SIZE: str = "1GB"
    POSTGRES_WORK_MEM: str = "4MB"
    POSTGRES_MAINTENANCE_WORK_MEM: str = "64MB"
    POSTGRES_MAX_CONNECTIONS: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignorar variables extra en lugar de fallar


# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
    # Enforce required secrets in production
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is required in production and must be provided via environment")
elif os.getenv("ENVIRONMENT") == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
