"""
Endpoints para autenticación nativa con NextAuth.js
"""

import os
import smtplib
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, or_, select

from cactus_wealth.core.config import settings
from cactus_wealth.core.crypto import get_password_hash, verify_password
from cactus_wealth.core.logging_config import get_structured_logger
from cactus_wealth.database import get_session
from cactus_wealth.models import EmailToken, User, UserRole

router = APIRouter()
logger = get_structured_logger(__name__)

# Sistema de detección de fuerza bruta
failed_attempts: dict[str, list[datetime]] = defaultdict(list)

def check_brute_force(email_or_username: str) -> bool:
    """Verificar si hay demasiados intentos fallidos para un usuario"""
    now = datetime.utcnow()
    one_minute_ago = now - timedelta(minutes=1)

    # Limpiar intentos antiguos
    failed_attempts[email_or_username] = [
        attempt for attempt in failed_attempts[email_or_username]
        if attempt > one_minute_ago
    ]

    # Verificar si hay más de 3 intentos en el último minuto
    if len(failed_attempts[email_or_username]) >= 3:
        print(f"🚨 Posible ataque de fuerza bruta detectado para: {email_or_username}")
        return True

    return False

def record_failed_attempt(email_or_username: str) -> None:
    """Registrar un intento fallido"""
    failed_attempts[email_or_username].append(datetime.utcnow())

# Modelos Pydantic
class CredentialsVerifyRequest(BaseModel):
    emailOrUsername: str
    password: str

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirmPassword: str
    role: str | None = "ADVISOR"
    managerId: int | None = None

class EmailVerifyRequest(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    username: str
    role: str
    email_verified: bool
    auth_provider: str

# Función para enviar email de verificación
async def send_verification_email(email: str, token: str, name: str) -> bool:
    """Enviar email de verificación con SendGrid SMTP"""
    try:
        smtp_host = settings.EMAIL_SERVER_HOST
        smtp_port = settings.EMAIL_SERVER_PORT
        smtp_user = settings.EMAIL_SERVER_USER
        smtp_password = settings.EMAIL_SERVER_PASS
        email_from = settings.EMAIL_FROM

        if not all([smtp_host, smtp_user, smtp_password, email_from]):
            raise HTTPException(
                status_code=500,
                detail="Configuración SMTP incompleta. Verifica EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASS y EMAIL_FROM",
            )

        # Crear el mensaje
        msg = MIMEMultipart()
        msg['From'] = email_from
        msg['To'] = email
        msg['Subject'] = "🌵 Verifica tu cuenta - Cactus Wealth"

        # URL de verificación
        base_url = settings.NEXTAUTH_URL
        verify_url = f"{base_url}/auth/verify?token={token}"

        # Cuerpo del email en HTML mejorado
        html_body = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifica tu cuenta - Cactus Wealth</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 40px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🌵</div>
                    <h1 style="color: #16a34a; margin: 0; font-size: 28px; font-weight: 700;">Cactus Wealth</h1>
                    <p style="color: #64748b; margin: 8px 0 0 0; font-size: 16px;">Financial Advisory Dashboard</p>
                </div>

                <div style="background-color: #f1f5f9; padding: 32px; border-radius: 8px; margin-bottom: 32px;">
                    <h2 style="color: #1e293b; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">¡Bienvenido a Cactus Wealth!</h2>

                    <p style="color: #475569; margin: 0 0 16px 0; font-size: 16px; line-height: 1.6;">
                        Hola <strong>{name}</strong>,
                    </p>

                    <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                        Gracias por registrarte en Cactus Wealth. Para completar tu registro y acceder a tu dashboard, necesitas verificar tu dirección de email.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="{verify_url}"
                           style="background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2); transition: all 0.2s;">
                            ✅ Verificar mi cuenta
                        </a>
                    </div>

                    <p style="color: #64748b; margin: 24px 0 16px 0; font-size: 14px; text-align: center;">
                        O copia y pega este enlace en tu navegador:
                    </p>
                    <p style="word-break: break-all; color: #64748b; font-size: 14px; background-color: #f8fafc; padding: 12px; border-radius: 4px; margin: 0; font-family: monospace;">
                        {verify_url}
                    </p>
                </div>

                <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                    <p style="color: #64748b; margin: 0 0 8px 0; font-size: 14px;">
                        ⏰ Este enlace expirará en <strong>24 horas</strong> por seguridad.
                    </p>
                    <p style="color: #64748b; margin: 0; font-size: 14px;">
                        Si no creaste esta cuenta, puedes ignorar este email de forma segura.
                    </p>
                </div>
            </div>

            <div style="text-align: center; margin-top: 32px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    © 2024 Cactus Wealth - Financial Advisory Dashboard
                </p>
            </div>
        </body>
        </html>
        """

        # Versión texto plano para compatibilidad
        text_body = f"""
        🌵 Cactus Wealth - Verificación de Cuenta

        Hola {name},

        Gracias por registrarte en Cactus Wealth. Para completar tu registro, verifica tu dirección de email haciendo clic en el siguiente enlace:

        {verify_url}

        Este enlace expirará en 24 horas por seguridad.

        Si no creaste esta cuenta, puedes ignorar este email.

        © 2024 Cactus Wealth
        """

        msg.attach(MIMEText(text_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        # Enviar el email con SendGrid SMTP
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        logger.info("email_verification_sent", email=email)
        return True

    except Exception as e:  # noqa: BLE001
        logger.error("email_send_error", email=email, error=str(e))
        return False

@router.post("/verify-credentials")
async def verify_credentials(
    request: CredentialsVerifyRequest,
    db: Session = Depends(get_session)
) -> UserResponse:
    """Verificar credenciales de usuario para NextAuth.js"""
    try:
        logger.info("login_attempt", identifier=request.emailOrUsername)

        # Verificar si hay demasiados intentos fallidos
        if check_brute_force(request.emailOrUsername):
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos fallidos. Intente más tarde.",
            )

        # Buscar usuario por email o username
        stmt = select(User).where(
            or_(
                User.email == request.emailOrUsername,
                User.username == request.emailOrUsername
            )
        )
        user = db.exec(stmt).first()

        if not user:
            logger.info("user_not_found", identifier=request.emailOrUsername)
            record_failed_attempt(request.emailOrUsername)
            raise HTTPException(
                status_code=401,
                detail="Usuario no encontrado"
            )

        logger.debug("user_found", username=user.username, email_verified=bool(user.email_verified))

        # Verificar que el usuario use autenticación local
        if user.auth_provider != "local":
            raise HTTPException(
                status_code=401,
                detail="Este usuario debe usar Google OAuth"
            )

        # Verificar contraseña
        if not user.hashed_password:
            raise HTTPException(
                status_code=401,
                detail="Usuario sin contraseña configurada"
            )

        password_valid = verify_password(request.password, user.hashed_password)
        logger.debug("password_checked", valid=bool(password_valid))

        if not password_valid:
            logger.info("invalid_password", username=user.username)
            record_failed_attempt(request.emailOrUsername)
            raise HTTPException(
                status_code=401,
                detail="Contraseña incorrecta"
            )

        # Verificar que el usuario esté activo
        if not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="Cuenta desactivada"
            )

        # Verificar que el email esté verificado
        if not user.email_verified:
            logger.info("email_not_verified", username=user.username)
            raise HTTPException(
                status_code=401,
                detail="Por favor, verifica tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
            )

        logger.info("login_success", username=user.username)

        if user.id is None:
            raise HTTPException(status_code=500, detail="Usuario inválido sin ID")

        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.username,  # Usar username como name
            username=user.username,
            role=user.role.value,
            email_verified=user.email_verified,
            auth_provider=user.auth_provider
        )

    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.exception("verify_credentials_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        ) from e

@router.post("/register")
async def register_user(
    request: UserRegisterRequest,
    db: Session = Depends(get_session)
) -> dict[str, object]:
    """Registrar nuevo usuario con verificación de email"""
    try:
        logger.info("register_start", email=str(request.email), username=request.username)
        # Validar contraseñas
        if request.password != request.confirmPassword:
            raise HTTPException(
                status_code=400,
                detail="Las contraseñas no coinciden"
            )

        if len(request.password) < 8:
            raise HTTPException(
                status_code=400,
                detail="La contraseña debe tener al menos 8 caracteres"
            )

        # Verificar que el email no exista
        existing_email = db.exec(select(User).where(User.email == request.email)).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Este email ya está registrado"
            )

        # Verificar que el username no exista
        existing_username = db.exec(select(User).where(User.username == request.username)).first()
        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Este nombre de usuario ya está en uso"
            )

        # Validar rol
        try:
            user_role = UserRole((request.role or "ADVISOR").upper())
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail="Rol inválido"
            ) from e

        # Crear usuario
        hashed_password = get_password_hash(request.password)

        new_user = User(
            email=request.email,
            username=request.username,
            hashed_password=hashed_password,
            role=user_role,
            auth_provider="local",
            email_verified=False,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Si es Advisor y se especifica managerId, asignarlo
        if user_role == UserRole.ADVISOR and request.managerId:
            manager = db.exec(select(User).where(User.id == request.managerId)).first()
            if manager and manager.role in [UserRole.MANAGER, UserRole.GOD]:
                new_user.manager_id = request.managerId

        db.add(new_user)
        try:
            db.commit()
            db.refresh(new_user)
            logger.info("user_created", user_id=new_user.id)
        except Exception as commit_error:  # noqa: BLE001
            logger.error("user_create_commit_error", error=str(commit_error))
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Error guardando usuario en base de datos"
            ) from commit_error

        # Generar token de verificación
        verification_token = str(uuid.uuid4())

        # Crear registro de token en la tabla EmailToken
        email_token = EmailToken(
            token=verification_token,
            user_id=new_user.id,
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(email_token)

        try:
            db.commit()
            logger.info("verification_token_created", user_id=new_user.id)
        except Exception as token_commit_error:  # noqa: BLE001
            logger.error("verification_token_commit_error", error=str(token_commit_error))
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Error creando token de verificación"
            ) from token_commit_error

        # Enviar email de verificación
        logger.info("sending_verification_email", email=str(request.email))
        email_sent = await send_verification_email(
            request.email,
            verification_token,
            request.name
        )

        if not email_sent:
            logger.warning("verification_email_send_failed", user_id=new_user.id)
            # Si no se puede enviar el email, eliminar primero los tokens y luego el usuario
            try:
                # Eliminar tokens asociados al usuario
                if new_user.id is None:
                    raise HTTPException(status_code=500, detail="Usuario inválido sin ID")
                tokens = db.exec(select(EmailToken).where(EmailToken.user_id == new_user.id)).all()
                for token in tokens:
                    db.delete(token)
                # Eliminar el usuario
                db.delete(new_user)
                db.commit()
                logger.info("user_and_tokens_deleted_after_email_fail", user_id=new_user.id)
            except Exception as cleanup_error:
                logger.error("cleanup_after_email_fail_error", error=str(cleanup_error))
                db.rollback()

            raise HTTPException(
                status_code=500,
                detail="Error enviando email de verificación"
            )

        logger.info("verification_email_sent_ok", user_id=new_user.id)

        return {
            "message": "Usuario registrado exitosamente",
            "email": request.email,
            "verification_sent": True,
            "note": "Revisa tu bandeja de entrada para verificar tu cuenta"
        }

    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.exception("register_user_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        ) from e

@router.post("/verify-email")
async def verify_email(
    request: EmailVerifyRequest,
    db: Session = Depends(get_session)
) -> dict[str, object]:
    """Verificar email usando token"""
    try:
        logger.info("verify_email_start", token_prefix=request.token[:10])
        if not request.token:
            raise HTTPException(
                status_code=400,
                detail="Token requerido"
            )

        # Buscar token en la base de datos
        email_token = db.exec(
            select(EmailToken).where(EmailToken.token == request.token)
        ).first()

        if not email_token:
            logger.info("email_token_not_found")
            raise HTTPException(
                status_code=400,
                detail="Token inválido o expirado"
            )

        logger.debug("email_token_found", expires_at=email_token.expires_at.isoformat() if email_token.expires_at else None)

        # Verificar que el token no haya expirado
        if email_token.expires_at < datetime.utcnow():
            print("[DEBUG] Token expirado, eliminando")
            # Eliminar token expirado
            db.delete(email_token)
            try:
                db.commit()
            except Exception as cleanup_error:  # noqa: BLE001
                logger.error("verify_email_cleanup_commit_error", error=str(cleanup_error))
                db.rollback()

            raise HTTPException(
                status_code=400,
                detail="Token expirado"
            )

        # Obtener el usuario asociado al token
        user = db.exec(select(User).where(User.id == email_token.user_id)).first()
        if not user:
            logger.info("user_not_found_for_token")
            raise HTTPException(
                status_code=400,
                detail="Usuario no encontrado"
            )

        print(f"[DEBUG] Usuario encontrado: {user.username}")

        # Marcar email como verificado
        user.email_verified = True
        user.updated_at = datetime.utcnow()

        # Eliminar el token usado
        db.delete(email_token)

        try:
            db.commit()
            logger.info("email_verified", username=user.username)
        except Exception as commit_error:  # noqa: BLE001
            logger.error("verify_email_commit_error", error=str(commit_error))
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Error guardando verificación en base de datos"
            ) from commit_error

        return {
            "message": "Email verificado exitosamente",
            "verified": True
        }

    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.exception("verify_email_unexpected_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        ) from e

@router.get("/debug-users")
async def debug_users(
    db: Session = Depends(get_session)
) -> dict[str, object]:
    """Endpoint de debug para listar usuarios disponibles (solo en desarrollo)"""

    # Solo permitir en desarrollo o cuando DEBUG está habilitado
    environment = os.getenv("ENVIRONMENT", "development")
    debug_mode = os.getenv("DEBUG", "false").lower() == "true"

    if environment == "production" and not debug_mode:
        raise HTTPException(
            status_code=404,
            detail="Endpoint no disponible en producción"
        )

    try:
        logger.info("debug_users_list_start")

        # Obtener todos los usuarios con información básica
        users = db.exec(select(User)).all()

        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role.value,
                "email_verified": user.email_verified,
                "auth_provider": user.auth_provider,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            })

        logger.info("debug_users_list_end", count=len(user_list))

        return {
            "total_users": len(user_list),
            "users": user_list,
            "note": "Este endpoint solo está disponible en desarrollo"
        }

    except Exception as e:  # noqa: BLE001
        logger.exception("debug_users_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        ) from e
