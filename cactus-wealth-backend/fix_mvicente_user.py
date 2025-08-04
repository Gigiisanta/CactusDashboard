#!/usr/bin/env python3
"""
Script para arreglar el usuario mvicente.
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
                "updated_at": datetime.now(timezone.utc)
            }
        )
        
        session.commit()
        print("✅ Usuario mvicente arreglado exitosamente!")
        print("📋 Datos actualizados:")
        print(f"📧 Email: mvicente@grupoabax.com")
        print(f"👤 Usuario: mvicente")
        print(f"🔑 Contraseña: Mvicente123")
        print(f"👑 Rol: MANAGER")
        print(f"✅ Email verificado: True")
        print(f"✅ Activo: True")

if __name__ == "__main__":
    main() 