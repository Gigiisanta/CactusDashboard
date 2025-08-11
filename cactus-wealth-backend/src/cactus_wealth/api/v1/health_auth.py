"""
Endpoint de health check para el sistema de autenticación.
"""

import os
import smtplib
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from sqlmodel import Session, select, text

from cactus_wealth.database import get_session
from cactus_wealth.models import User

router = APIRouter()

@router.get("/health/auth")
async def health_auth(db: Session = Depends(get_session)) -> dict[str, Any]:
    """
    Endpoint de health check para el sistema de autenticación.
    Verifica:
    - Conexión a la base de datos
    - Existencia de tablas de usuarios
    - Configuración SMTP
    - Usuario super-admin
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }

    try:
        # 1. Verificar conexión a la base de datos
        try:
            db.exec(text("SELECT 1")).first()
            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Conexión a la base de datos exitosa"
            }
        except Exception as e:
            health_status["checks"]["database"] = {
                "status": "unhealthy",
                "message": f"Error de conexión a la base de datos: {str(e)}"
            }
            health_status["status"] = "unhealthy"

        # 2. Verificar tabla de usuarios
        try:
            user_count = db.exec(text("SELECT COUNT(*) FROM users")).first()
            health_status["checks"]["users_table"] = {
                "status": "healthy",
                "message": f"Tabla users existe con {user_count} usuarios"
            }
        except Exception as e:
            health_status["checks"]["users_table"] = {
                "status": "unhealthy",
                "message": f"Error accediendo tabla users: {str(e)}"
            }
            health_status["status"] = "unhealthy"

        # 3. Verificar usuario super-admin
        try:
            super_admin = db.exec(
                select(User).where(User.email == "gsantarelli@grupoabax.com")
            ).first()

            if super_admin:
                health_status["checks"]["super_admin"] = {
                    "status": "healthy",
                    "message": f"Usuario super-admin existe (ID: {super_admin.id})"
                }
            else:
                health_status["checks"]["super_admin"] = {
                    "status": "warning",
                    "message": "Usuario super-admin no encontrado"
                }
        except Exception as e:
            health_status["checks"]["super_admin"] = {
                "status": "unhealthy",
                "message": f"Error verificando super-admin: {str(e)}"
            }

        # 4. Verificar configuración SMTP
        smtp_config = {
            "host": os.getenv("EMAIL_SERVER_HOST"),
            "port": os.getenv("EMAIL_SERVER_PORT"),
            "user": os.getenv("EMAIL_SERVER_USER"),
            "password": os.getenv("EMAIL_SERVER_PASS"),
            "from": os.getenv("EMAIL_FROM")
        }

        missing_smtp = [key for key, value in smtp_config.items() if not value]

        if missing_smtp:
            health_status["checks"]["smtp_config"] = {
                "status": "warning",
                "message": f"Variables SMTP faltantes: {', '.join(missing_smtp)}"
            }
        else:
            # Probar conexión SMTP (sin enviar email)
            try:
                smtp_host = smtp_config["host"]
                smtp_port = int(smtp_config["port"])

                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_config["user"], smtp_config["password"])

                health_status["checks"]["smtp_config"] = {
                    "status": "healthy",
                    "message": f"Conexión SMTP exitosa a {smtp_host}:{smtp_port}"
                }
            except Exception as e:
                health_status["checks"]["smtp_config"] = {
                    "status": "unhealthy",
                    "message": f"Error de conexión SMTP: {str(e)}"
                }
                health_status["status"] = "unhealthy"

        # 5. Verificar variables de NextAuth
        nextauth_vars = {
            "NEXTAUTH_SECRET": os.getenv("NEXTAUTH_SECRET"),
            "NEXTAUTH_URL": os.getenv("NEXTAUTH_URL"),
            "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"),
            "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET")
        }

        missing_nextauth = [key for key, value in nextauth_vars.items() if not value]

        if missing_nextauth:
            health_status["checks"]["nextauth_config"] = {
                "status": "warning",
                "message": f"Variables NextAuth faltantes: {', '.join(missing_nextauth)}"
            }
        else:
            health_status["checks"]["nextauth_config"] = {
                "status": "healthy",
                "message": "Variables NextAuth configuradas correctamente"
            }

        return health_status

    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Error general en health check: {str(e)}",
            "checks": health_status.get("checks", {})
        }
