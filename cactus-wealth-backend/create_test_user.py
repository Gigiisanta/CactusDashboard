#!/usr/bin/env python3
"""
Script para crear un usuario de prueba.
"""

import os
import sys
from datetime import datetime

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from sqlmodel import Session, create_engine

from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash


def main():
    print("👤 Creando usuario de prueba...")

    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    # Crear usuario de prueba
    with Session(engine) as session:
        # Verificar si el usuario ya existe
        result = session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": "demo@cactuswealth.com"}
        ).first()

        if result:
            print("⚠️  Usuario demo@cactuswealth.com ya existe")
            return

        # Crear hash de la contraseña
        hashed_password = get_password_hash("demo123")

        # Insertar usuario
        session.execute(
            text("""
                INSERT INTO users (
                    email, username, hashed_password, is_active, role,
                    auth_provider, email_verified, created_at, updated_at
                ) VALUES (
                    :email, :username, :hashed_password, :is_active, :role,
                    :auth_provider, :email_verified, :created_at, :updated_at
                )
            """),
            {
                "email": "demo@cactuswealth.com",
                "username": "demo",
                "hashed_password": hashed_password,
                "is_active": True,
                "role": "ADVISOR",
                "auth_provider": "local",
                "email_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        )

        session.commit()
        print("✅ Usuario de prueba creado exitosamente!")
        print("📧 Email: demo@cactuswealth.com")
        print("🔑 Password: demo123")

if __name__ == "__main__":
    main()
