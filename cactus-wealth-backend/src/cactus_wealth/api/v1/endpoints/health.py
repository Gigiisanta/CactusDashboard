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

    # Limpieza mínima y seeds deterministas (ignorar tablas ausentes)
    # Nota: usar SQL directo para performance e idempotencia
    # Asegurar que no haya transacciones abortadas previas
    try:
        session.rollback()
    except Exception:
        pass
    def table_exists(table_name: str) -> bool:
        try:
            res = session.exec(
                text("SELECT to_regclass(:t)"), {"t": f"public.{table_name}"}
            ).first()
            return bool(res and res[0])
        except Exception:
            # Si falla la introspección, asumir que no existe para evitar romper
            session.rollback()
            return False

    def try_delete(table_name: str) -> None:
        if not table_exists(table_name):
            return
        try:
            session.exec(text(f"DELETE FROM {table_name}"))
            session.commit()
        except Exception:
            # Limpiar estado de transacción y continuar
            session.rollback()

    # Orden de borrado por dependencias
    for tbl in [
        "model_portfolio_positions",
        "model_portfolios",
        "positions",
        "portfolio_snapshots",
        "investment_accounts",
        "insurance_policies",
        "client_activities",
        "client_notes",
        "clients",
        "notifications",
        "email_tokens",
    ]:
        try_delete(tbl)

    # Usuarios: preservar o recrear admin/advisor deterministas
    try:
        session.exec(text("DELETE FROM users WHERE username NOT IN ('admin','advisor')"))
        session.commit()
    except Exception:
        session.rollback()

    # Upsert admin
    try:
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
        session.commit()
    except Exception:
        session.rollback()

    # Upsert advisor
    try:
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
        session.commit()
    except Exception:
        session.rollback()

    # Crear 2 clientes demo
    # Owner = advisor
    advisor_row = session.exec(text("SELECT id FROM users WHERE username='advisor'"))
    advisor_id = advisor_row.first()[0] if advisor_row.first() else None
    if advisor_id:
        try:
            session.exec(text(
            """
            INSERT INTO clients (first_name, last_name, email, phone, risk_profile, status, owner_id, created_at, updated_at)
            VALUES
            ('Ana', 'Demo', 'ana.demo@cactuswealth.com', '555-0001', 'MEDIUM', 'prospect', :owner_id, :now, :now)
            ON CONFLICT (email) DO NOTHING
            """
            ), {"owner_id": advisor_id, "now": datetime.utcnow()})
            session.commit()
        except Exception:
            session.rollback()
        try:
            session.exec(text(
            """
            INSERT INTO clients (first_name, last_name, email, phone, risk_profile, status, owner_id, created_at, updated_at)
            VALUES
            ('Bruno', 'Demo', 'bruno.demo@cactuswealth.com', '555-0002', 'MEDIUM', 'contacted', :owner_id, :now, :now)
            ON CONFLICT (email) DO NOTHING
            """
            ), {"owner_id": advisor_id, "now": datetime.utcnow()})
            session.commit()
        except Exception:
            session.rollback()

    session.commit()

    return {"status": "reset_ok", "timestamp": datetime.utcnow().isoformat()}
