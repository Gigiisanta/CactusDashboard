#!/usr/bin/env python3
"""
Script para arreglar el usuario mvicente.
"""

import os
import sys
from datetime import UTC, datetime

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from sqlmodel import Session, create_engine

from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash


def main():
    print("🔧 Arreglando usuario mvicente...")

    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    # Arreglar usuario mvicente
    with Session(engine) as session:
        # Actualizar usuario mvicente
        session.execute(
            text("""
                UPDATE users SET 
                    hashed_password = :password,
                    email_verified = :email_verified,
                    updated_at = :updated_at
                WHERE email = :email
            """),
            {
                "email": "mvicente@grupoabax.com",
                "password": get_password_hash("Mvicente123"),
                "email_verified": True,
                "updated_at": datetime.now(UTC)
            }
        )

        session.commit()
        print("✅ Usuario mvicente arreglado exitosamente!")
        print("📋 Datos actualizados:")
        print("📧 Email: mvicente@grupoabax.com")
        print("👤 Usuario: mvicente")
        print("🔑 Contraseña: Mvicente123")
        print("👑 Rol: MANAGER")
        print("✅ Email verificado: True")
        print("✅ Activo: True")

if __name__ == "__main__":
    main()
