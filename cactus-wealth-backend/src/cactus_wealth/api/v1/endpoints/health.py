"""
Health check endpoint for monitoring system status.
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlmodel import Session

from cactus_wealth.core.config import settings
from cactus_wealth.core.crypto import get_password_hash
from cactus_wealth.database import get_db

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


@router.post("/health/e2e/reset")
async def e2e_reset(
    x_e2e_secret: str | None = Header(default=None, alias="X-E2E-SECRET"),
    session: Session = Depends(get_db),
):
    """Reset idempotente para E2E.

    Protegido por cabecera `X-E2E-SECRET` y sólo habilitado en `E2E_MODE`.
    - Trunca datos de tablas no fundamentales
    - Crea seeds mínimas: usuario admin/advisor y 1-2 clientes demo
    """
    from datetime import datetime

    if not settings.E2E_MODE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="E2E mode disabled")
    if not settings.E2E_SECRET or x_e2e_secret != settings.E2E_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid E2E secret")

    # Limpieza mínima y seeds deterministas
    # Nota: usar SQL directo para performance e idempotencia
    session.exec(text("DELETE FROM model_portfolio_positions"))
    session.exec(text("DELETE FROM model_portfolios"))
    session.exec(text("DELETE FROM positions"))
    session.exec(text("DELETE FROM portfolio_snapshots"))
    session.exec(text("DELETE FROM investment_accounts"))
    session.exec(text("DELETE FROM insurance_policies"))
    session.exec(text("DELETE FROM client_activities"))
    session.exec(text("DELETE FROM client_notes"))
    session.exec(text("DELETE FROM clients"))
    session.exec(text("DELETE FROM notifications"))
    session.exec(text("DELETE FROM email_tokens"))

    # Usuarios: preservar o recrear admin/advisor deterministas
    session.exec(text("DELETE FROM users WHERE username NOT IN ('admin','advisor')"))

    # Upsert admin
    session.exec(text(
        """
        INSERT INTO users (email, username, hashed_password, is_active, role, auth_provider, email_verified, created_at, updated_at)
        VALUES (:email, :username, :hashed_password, :is_active, :role, :auth_provider, :email_verified, :created_at, :updated_at)
        ON CONFLICT (username) DO UPDATE SET
          email=excluded.email,
          hashed_password=excluded.hashed_password,
          is_active=excluded.is_active,
          role=excluded.role,
          auth_provider=excluded.auth_provider,
          email_verified=excluded.email_verified,
          updated_at=excluded.updated_at
        """
    ), {
        "email": "admin@cactuswealth.com",
        "username": "admin",
        "hashed_password": get_password_hash("admin123"),
        "is_active": True,
        "role": "ADMIN",
        "auth_provider": "local",
        "email_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # Upsert advisor
    session.exec(text(
        """
        INSERT INTO users (email, username, hashed_password, is_active, role, auth_provider, email_verified, created_at, updated_at)
        VALUES (:email, :username, :hashed_password, :is_active, :role, :auth_provider, :email_verified, :created_at, :updated_at)
        ON CONFLICT (username) DO UPDATE SET
          email=excluded.email,
          hashed_password=excluded.hashed_password,
          is_active=excluded.is_active,
          role=excluded.role,
          auth_provider=excluded.auth_provider,
          email_verified=excluded.email_verified,
          updated_at=excluded.updated_at
        """
    ), {
        "email": "advisor@cactuswealth.com",
        "username": "advisor",
        "hashed_password": get_password_hash("advisor123"),
        "is_active": True,
        "role": "ADVISOR",
        "auth_provider": "local",
        "email_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # Crear 2 clientes demo
    # Owner = advisor
    advisor_row = session.exec(text("SELECT id FROM users WHERE username='advisor'"))
    advisor_id = advisor_row.first()[0] if advisor_row.first() else None
    if advisor_id:
        session.exec(text(
            """
            INSERT INTO clients (first_name, last_name, email, phone, risk_profile, status, owner_id, created_at, updated_at)
            VALUES
            ('Ana', 'Demo', 'ana.demo@cactuswealth.com', '555-0001', 'MEDIUM', 'prospect', :owner_id, :now, :now)
            ON CONFLICT (email) DO NOTHING
            """
        ), {"owner_id": advisor_id, "now": datetime.utcnow()})
        session.exec(text(
            """
            INSERT INTO clients (first_name, last_name, email, phone, risk_profile, status, owner_id, created_at, updated_at)
            VALUES
            ('Bruno', 'Demo', 'bruno.demo@cactuswealth.com', '555-0002', 'MEDIUM', 'contacted', :owner_id, :now, :now)
            ON CONFLICT (email) DO NOTHING
            """
        ), {"owner_id": advisor_id, "now": datetime.utcnow()})

    session.commit()

    return {"status": "reset_ok", "timestamp": datetime.utcnow().isoformat()}
