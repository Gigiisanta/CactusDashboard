#!/usr/bin/env python3
"""
Script para actualizar completamente los datos del usuario Gio.
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
    print("🔄 Actualizando usuario Gio...")

    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    # Actualizar usuario
    with Session(engine) as session:
        # Actualizar todos los campos
        session.execute(
            text("""
                UPDATE users SET
                    username = :username,
                    hashed_password = :password,
                    role = :role,
                    email_verified = :email_verified,
                    updated_at = :updated_at
                WHERE email = :email
            """),
            {
                "email": "giolivosantarelli@gmail.com",
                "username": "Gio",
                "password": get_password_hash("Gigi123"),
                "role": "MANAGER",
                "email_verified": True,
                "updated_at": datetime.now(UTC)
            }
        )

        session.commit()
        print("✅ Usuario Gio actualizado exitosamente!")
        print("📋 Datos actualizados:")
        print("📧 Email: giolivosantarelli@gmail.com")
        print("👤 Usuario: Gio")
        print("🔑 Contraseña: Gigi123")
        print("👑 Rol: MANAGER")
        print("✅ Email verificado: True")
        print("✅ Activo: True")

if __name__ == "__main__":
    main()
