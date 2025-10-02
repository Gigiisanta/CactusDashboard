#!/usr/bin/env python3
"""
Script para verificar y actualizar los datos del usuario Gio.
"""

import os
import sys
from datetime import UTC, datetime

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from sqlmodel import Session, create_engine

from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash, verify_password


def main():
    print("🔍 Verificando usuario Gio...")

    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    # Buscar usuario
    with Session(engine) as session:
        result = session.execute(
            text("SELECT * FROM users WHERE email = :email OR username = :username"),
            {"email": "giolivosantarelli@gmail.com", "username": "Gio"}
        )
        user = result.fetchone()

        if user:
            print("✅ Usuario encontrado:")
            print(f"📧 Email: {user.email}")
            print(f"👤 Usuario: {user.username}")
            print(f"👑 Rol: {user.role}")
            print(f"✅ Activo: {user.is_active}")
            print(f"✅ Email verificado: {user.email_verified}")

            # Verificar si la contraseña es correcta
            if verify_password("Gigi123", user.hashed_password):
                print("🔑 Contraseña: Correcta")
            else:
                print("🔑 Contraseña: Incorrecta - Actualizando...")
                # Actualizar contraseña
                session.execute(
                    text("UPDATE users SET hashed_password = :password, updated_at = :updated_at WHERE id = :id"),
                    {
                        "password": get_password_hash("Gigi123"),
                        "updated_at": datetime.now(UTC),
                        "id": user.id
                    }
                )
                session.commit()
                print("✅ Contraseña actualizada correctamente")
        else:
            print("❌ Usuario no encontrado")

if __name__ == "__main__":
    main()
