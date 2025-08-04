#!/usr/bin/env python3
"""
Script para actualizar completamente los datos del usuario Gio.
"""

import sys
import os
from datetime import datetime, timezone

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import Session, create_engine
from sqlalchemy import text
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
                "updated_at": datetime.now(timezone.utc)
            }
        )
        
        session.commit()
        print("✅ Usuario Gio actualizado exitosamente!")
        print("📋 Datos actualizados:")
        print(f"📧 Email: giolivosantarelli@gmail.com")
        print(f"👤 Usuario: Gio")
        print(f"🔑 Contraseña: Gigi123")
        print(f"👑 Rol: MANAGER")
        print(f"✅ Email verificado: True")
        print(f"✅ Activo: True")

if __name__ == "__main__":
    main() 