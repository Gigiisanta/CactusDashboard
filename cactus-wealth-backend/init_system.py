#!/usr/bin/env python3
"""
Script de inicialización completa del sistema Cactus Wealth.
Este script resuelve todos los problemas de forma permanente.
"""

import sys
import os
import sqlite3
from datetime import datetime, timezone

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash

# Importar todos los modelos
from cactus_wealth.models import (
    User, EmailToken, Client, ClientActivity, ClientNote, Asset, 
    Portfolio, Position, PortfolioSnapshot, Report, InvestmentAccount,
    InsurancePolicy, Notification, ModelPortfolio, ModelPortfolioPosition,
    WebAuthnCredential, CactusIdea, CactusContentMatrix, CactusVideoSlot,
    CactusLibrary, CactusExternalLink, CactusSecureCredential
)

def reset_database():
    """Eliminar y recrear completamente la base de datos."""
    print("🔄 Reseteando base de datos...")
    
    # Eliminar archivo de base de datos si existe
    db_file = "cactus_wealth.db"
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f"🗑️  Eliminado archivo: {db_file}")
    
    # Crear nueva base de datos SQLite
    print("📝 Creando nueva base de datos...")
    conn = sqlite3.connect(db_file)
    conn.close()
    
    # Crear engine
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    
    # Crear todas las tablas usando SQLModel
    print("🏗️  Creando todas las tablas...")
    SQLModel.metadata.create_all(engine)
    
    # Verificar tablas creadas
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"📋 Tablas creadas ({len(tables)}): {', '.join(tables)}")
    
    return engine

def create_default_users(engine):
    """Crear usuarios por defecto del sistema."""
    print("👥 Creando usuarios por defecto...")
    
    default_users = [
        {
            "email": "giolivosantarelli@gmail.com",
            "username": "Gio",
            "password": "Gigi123",
            "role": "MANAGER",
            "is_active": True,
            "email_verified": True,
            "auth_provider": "local"
        },
        {
            "email": "mvicente@grupoabax.com",
            "username": "mvicente",
            "password": "Mvicente123",
            "role": "MANAGER",
            "is_active": True,
            "email_verified": True,
            "auth_provider": "local"
        },
        {
            "email": "demo@cactuswealth.com",
            "username": "demo",
            "password": "Demo123",
            "role": "ADVISOR",
            "is_active": True,
            "email_verified": True,
            "auth_provider": "local"
        }
    ]
    
    with Session(engine) as session:
        for user_data in default_users:
            # Verificar si el usuario ya existe
            existing = session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": user_data["email"]}
            ).first()
            
            if existing:
                print(f"⚠️  Usuario {user_data['email']} ya existe, actualizando...")
                # Actualizar usuario existente
                session.execute(
                    text("""
                        UPDATE users SET 
                            username = :username,
                            hashed_password = :hashed_password,
                            role = :role,
                            is_active = :is_active,
                            email_verified = :email_verified,
                            auth_provider = :auth_provider,
                            updated_at = :updated_at
                        WHERE email = :email
                    """),
                    {
                        "username": user_data["username"],
                        "hashed_password": get_password_hash(user_data["password"]),
                        "role": user_data["role"],
                        "is_active": user_data["is_active"],
                        "email_verified": user_data["email_verified"],
                        "auth_provider": user_data["auth_provider"],
                        "updated_at": datetime.now(timezone.utc),
                        "email": user_data["email"]
                    }
                )
            else:
                print(f"✅ Creando usuario {user_data['email']}...")
                # Crear nuevo usuario
                session.execute(
                    text("""
                        INSERT INTO users (
                            email, username, hashed_password, role, is_active, 
                            email_verified, auth_provider, created_at, updated_at
                        ) VALUES (
                            :email, :username, :hashed_password, :role, :is_active,
                            :email_verified, :auth_provider, :created_at, :updated_at
                        )
                    """),
                    {
                        "email": user_data["email"],
                        "username": user_data["username"],
                        "hashed_password": get_password_hash(user_data["password"]),
                        "role": user_data["role"],
                        "is_active": user_data["is_active"],
                        "email_verified": user_data["email_verified"],
                        "auth_provider": user_data["auth_provider"],
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    }
                )
        
        session.commit()
    
    print("✅ Usuarios creados/actualizados exitosamente!")

def verify_system(engine):
    """Verificar que el sistema esté funcionando correctamente."""
    print("🔍 Verificando sistema...")
    
    # Verificar usuarios
    with Session(engine) as session:
        users = session.execute(text("SELECT email, username, role, is_active, email_verified FROM users")).fetchall()
        print(f"👥 Usuarios en el sistema ({len(users)}):")
        for user in users:
            print(f"  - {user[0]} ({user[1]}) - {user[2]} - Activo: {user[3]} - Verificado: {user[4]}")
    
    # Verificar tablas
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"📋 Tablas disponibles ({len(tables)}): {', '.join(tables)}")
    
    print("✅ Sistema verificado correctamente!")

def main():
    """Función principal de inicialización."""
    print("🚀 Iniciando sistema Cactus Wealth...")
    print("=" * 50)
    
    try:
        # 1. Resetear base de datos
        engine = reset_database()
        
        # 2. Crear usuarios por defecto
        create_default_users(engine)
        
        # 3. Verificar sistema
        verify_system(engine)
        
        print("=" * 50)
        print("🎉 ¡Sistema inicializado exitosamente!")
        print("\n📋 Usuarios disponibles para login:")
        print("  👤 Gio (Manager): giolivosantarelli@gmail.com / Gigi123")
        print("  👤 Mvicente (Manager): mvicente@grupoabax.com / Mvicente123")
        print("  👤 Demo (Advisor): demo@cactuswealth.com / Demo123")
        print("\n🌐 URLs del sistema:")
        print("  Frontend: http://localhost:3000")
        print("  Backend: http://localhost:8000")
        print("  Login: http://localhost:3000/auth/login")
        
    except Exception as e:
        print(f"❌ Error durante la inicialización: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 