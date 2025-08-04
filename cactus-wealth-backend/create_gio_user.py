#!/usr/bin/env python3
"""
Script para crear el usuario Gio con datos específicos.
"""

import sys
import os
from datetime import datetime

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import Session, create_engine
from sqlalchemy import text
from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash

def main():
    print("👤 Creando usuario Gio...")
    
    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Datos del usuario
    user_data = {
        "email": "giolivosantarelli@gmail.com",
        "username": "Gio",
        "hashed_password": get_password_hash("Gigi123"),
        "is_active": True,
        "role": "MANAGER",
        "auth_provider": "local",
        "email_verified": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Crear usuario
    with Session(engine) as session:
        # Verificar si el usuario ya existe
        result = session.execute(
            text("SELECT id FROM users WHERE email = :email OR username = :username"),
            {"email": user_data["email"], "username": user_data["username"]}
        )
        existing_user = result.fetchone()
        
        if existing_user:
            print("⚠️  Usuario ya existe en la base de datos")
            return
        
        # Insertar nuevo usuario
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
            user_data
        )
        
        session.commit()
        print("✅ Usuario Gio creado exitosamente!")
        print(f"📧 Email: {user_data['email']}")
        print(f"👤 Usuario: {user_data['username']}")
        print(f"🔑 Contraseña: Gigi123")
        print(f"👑 Rol: {user_data['role']}")
        print(f"✅ Email verificado: {user_data['email_verified']}")

if __name__ == "__main__":
    main() 