#!/usr/bin/env python3
"""
Script para crear el usuario 'gio' con permisos GOD y verificar la conexión de la base de datos.
"""

import sys
import os
from datetime import datetime
from pathlib import Path

# Agregar el directorio src al path para importar los módulos
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sqlmodel import SQLModel, Session, create_engine, select, text
from cactus_wealth.models import User, UserRole
from cactus_wealth.security import get_password_hash
from cactus_wealth.database import get_engine

def verify_database_connection():
    """Verificar que la base de datos esté conectada y funcionando."""
    try:
        engine = get_engine()
        with Session(engine) as session:
            # Probar conexión básica
            result = session.exec(text("SELECT 1")).first()
            print("✅ Conexión a la base de datos exitosa")
            
            # Verificar que la tabla users existe (PostgreSQL)
            result = session.exec(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'users'
            """)).first()
            if result:
                print("✅ Tabla 'users' existe en la base de datos")
            else:
                print("❌ Tabla 'users' no existe en la base de datos")
                return False
                
            # Contar usuarios existentes
            user_count = session.exec(text("SELECT COUNT(*) FROM users")).first()
            print(f"📊 Usuarios existentes en la base de datos: {user_count}")
            
            return True
    except Exception as e:
        print(f"❌ Error de conexión a la base de datos: {e}")
        return False

def create_god_user():
    """Crear el usuario 'gio' con permisos GOD."""
    try:
        engine = get_engine()
        with Session(engine) as session:
            # Verificar si el usuario ya existe
            existing_user = session.exec(
                select(User).where(User.username == "gio")
            ).first()
            
            if existing_user:
                print("⚠️  El usuario 'gio' ya existe. Actualizando...")
                # Actualizar usuario existente
                existing_user.email = "gio@cactuswealth.com"
                existing_user.hashed_password = get_password_hash("gigi123")
                existing_user.role = UserRole.GOD
                existing_user.is_active = True
                existing_user.updated_at = datetime.utcnow()
                session.add(existing_user)
                session.commit()
                print("✅ Usuario 'gio' actualizado con permisos GOD")
            else:
                # Crear nuevo usuario
                new_user = User(
                    username="gio",
                    email="gio@cactuswealth.com",
                    hashed_password=get_password_hash("gigi123"),
                    role=UserRole.GOD,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                session.add(new_user)
                session.commit()
                print("✅ Usuario 'gio' creado exitosamente con permisos GOD")
            
            # Verificar que el usuario fue creado/actualizado correctamente
            user = session.exec(
                select(User).where(User.username == "gio")
            ).first()
            
            if user:
                print(f"📋 Detalles del usuario:")
                print(f"   - ID: {user.id}")
                print(f"   - Username: {user.username}")
                print(f"   - Email: {user.email}")
                print(f"   - Role: {user.role}")
                print(f"   - Active: {user.is_active}")
                print(f"   - Created: {user.created_at}")
                return True
            else:
                print("❌ Error: No se pudo verificar la creación del usuario")
                return False
                
    except Exception as e:
        print(f"❌ Error al crear el usuario: {e}")
        return False

def test_authentication():
    """Probar que el sistema de autenticación funciona correctamente."""
    try:
        from cactus_wealth.security import authenticate_user
        
        engine = get_engine()
        with Session(engine) as session:
            # Probar autenticación con el usuario creado
            user = authenticate_user(session, "gio", "gigi123")
            if user:
                print("✅ Autenticación del usuario 'gio' exitosa")
                print(f"   - Usuario autenticado: {user.username} ({user.role})")
                return True
            else:
                print("❌ Error: Falló la autenticación del usuario 'gio'")
                return False
                
    except Exception as e:
        print(f"❌ Error al probar autenticación: {e}")
        return False

def main():
    """Función principal del script."""
    print("🔍 Verificando conexión de la base de datos...")
    
    if not verify_database_connection():
        print("❌ No se puede continuar sin conexión a la base de datos")
        sys.exit(1)
    
    print("\n👤 Creando usuario 'gio' con permisos GOD...")
    
    if not create_god_user():
        print("❌ Error al crear el usuario")
        sys.exit(1)
    
    print("\n🔐 Probando sistema de autenticación...")
    
    if not test_authentication():
        print("❌ Error en el sistema de autenticación")
        sys.exit(1)
    
    print("\n🎉 ¡Todo completado exitosamente!")
    print("📝 Credenciales del usuario GOD:")
    print("   - Username: gio")
    print("   - Password: gigi123")
    print("   - Role: GOD")

if __name__ == "__main__":
    main()