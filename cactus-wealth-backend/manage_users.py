#!/usr/bin/env python3
"""
Script de gestión de usuarios para Cactus Wealth.
Permite crear, actualizar, listar y eliminar usuarios de forma fácil.
"""

import sys
import os
import argparse
from datetime import datetime, timezone

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import Session, create_engine
from sqlalchemy import text
from cactus_wealth.core.config import settings
from cactus_wealth.security import get_password_hash

def get_engine():
    """Obtener engine de la base de datos."""
    return create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

def list_users():
    """Listar todos los usuarios."""
    engine = get_engine()
    with Session(engine) as session:
        users = session.execute(
            text("SELECT id, email, username, role, is_active, email_verified, auth_provider, created_at FROM users ORDER BY id")
        ).fetchall()
        
        print("👥 Usuarios en el sistema:")
        print("-" * 80)
        print(f"{'ID':<3} {'Email':<30} {'Usuario':<15} {'Rol':<12} {'Activo':<6} {'Verificado':<10} {'Proveedor':<10}")
        print("-" * 80)
        
        for user in users:
            print(f"{user[0]:<3} {user[1]:<30} {user[2]:<15} {user[3]:<12} {'Sí' if user[4] else 'No':<6} {'Sí' if user[5] else 'No':<10} {user[6]:<10}")

def create_user(email, username, password, role="ADVISOR", is_active=True, email_verified=True):
    """Crear un nuevo usuario."""
    engine = get_engine()
    
    with Session(engine) as session:
        # Verificar si el usuario ya existe
        existing = session.execute(
            text("SELECT id FROM users WHERE email = :email OR username = :username"),
            {"email": email, "username": username}
        ).first()
        
        if existing:
            print(f"❌ Error: Ya existe un usuario con email '{email}' o username '{username}'")
            return False
        
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
                "email": email,
                "username": username,
                "hashed_password": get_password_hash(password),
                "role": role,
                "is_active": is_active,
                "email_verified": email_verified,
                "auth_provider": "local",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        )
        
        session.commit()
        print(f"✅ Usuario '{email}' creado exitosamente")
        return True

def update_user(email, **kwargs):
    """Actualizar un usuario existente."""
    engine = get_engine()
    
    with Session(engine) as session:
        # Verificar si el usuario existe
        existing = session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        ).first()
        
        if not existing:
            print(f"❌ Error: No existe un usuario con email '{email}'")
            return False
        
        # Construir query de actualización
        update_fields = []
        params = {"email": email}
        
        if "username" in kwargs:
            update_fields.append("username = :username")
            params["username"] = kwargs["username"]
        
        if "password" in kwargs:
            update_fields.append("hashed_password = :hashed_password")
            params["hashed_password"] = get_password_hash(kwargs["password"])
        
        if "role" in kwargs:
            update_fields.append("role = :role")
            params["role"] = kwargs["role"]
        
        if "is_active" in kwargs:
            update_fields.append("is_active = :is_active")
            params["is_active"] = kwargs["is_active"]
        
        if "email_verified" in kwargs:
            update_fields.append("email_verified = :email_verified")
            params["email_verified"] = kwargs["email_verified"]
        
        if not update_fields:
            print("❌ Error: No se especificaron campos para actualizar")
            return False
        
        update_fields.append("updated_at = :updated_at")
        params["updated_at"] = datetime.now(timezone.utc)
        
        # Ejecutar actualización
        session.execute(
            text(f"UPDATE users SET {', '.join(update_fields)} WHERE email = :email"),
            params
        )
        
        session.commit()
        print(f"✅ Usuario '{email}' actualizado exitosamente")
        return True

def delete_user(email):
    """Eliminar un usuario."""
    engine = get_engine()
    
    with Session(engine) as session:
        # Verificar si el usuario existe
        existing = session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": email}
        ).first()
        
        if not existing:
            print(f"❌ Error: No existe un usuario con email '{email}'")
            return False
        
        # Eliminar usuario
        session.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": email}
        )
        
        session.commit()
        print(f"✅ Usuario '{email}' eliminado exitosamente")
        return True

def reset_password(email, new_password):
    """Resetear contraseña de un usuario."""
    return update_user(email, password=new_password)

def main():
    """Función principal."""
    parser = argparse.ArgumentParser(description="Gestión de usuarios de Cactus Wealth")
    subparsers = parser.add_subparsers(dest="command", help="Comandos disponibles")
    
    # Comando list
    subparsers.add_parser("list", help="Listar todos los usuarios")
    
    # Comando create
    create_parser = subparsers.add_parser("create", help="Crear un nuevo usuario")
    create_parser.add_argument("email", help="Email del usuario")
    create_parser.add_argument("username", help="Nombre de usuario")
    create_parser.add_argument("password", help="Contraseña")
    create_parser.add_argument("--role", default="ADVISOR", choices=["GOD", "ADMIN", "MANAGER", "ADVISOR", "SENIOR_ADVISOR", "JUNIOR_ADVISOR"], help="Rol del usuario")
    create_parser.add_argument("--active", action="store_true", default=True, help="Usuario activo")
    create_parser.add_argument("--verified", action="store_true", default=True, help="Email verificado")
    
    # Comando update
    update_parser = subparsers.add_parser("update", help="Actualizar un usuario")
    update_parser.add_argument("email", help="Email del usuario a actualizar")
    update_parser.add_argument("--username", help="Nuevo nombre de usuario")
    update_parser.add_argument("--password", help="Nueva contraseña")
    update_parser.add_argument("--role", choices=["GOD", "ADMIN", "MANAGER", "ADVISOR", "SENIOR_ADVISOR", "JUNIOR_ADVISOR"], help="Nuevo rol")
    update_parser.add_argument("--active", type=bool, help="Estado activo (True/False)")
    update_parser.add_argument("--verified", type=bool, help="Email verificado (True/False)")
    
    # Comando delete
    delete_parser = subparsers.add_parser("delete", help="Eliminar un usuario")
    delete_parser.add_argument("email", help="Email del usuario a eliminar")
    
    # Comando reset-password
    reset_parser = subparsers.add_parser("reset-password", help="Resetear contraseña de un usuario")
    reset_parser.add_argument("email", help="Email del usuario")
    reset_parser.add_argument("new_password", help="Nueva contraseña")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "list":
            list_users()
        elif args.command == "create":
            create_user(
                args.email, 
                args.username, 
                args.password, 
                args.role, 
                args.active, 
                args.verified
            )
        elif args.command == "update":
            update_kwargs = {}
            if args.username:
                update_kwargs["username"] = args.username
            if args.password:
                update_kwargs["password"] = args.password
            if args.role:
                update_kwargs["role"] = args.role
            if args.active is not None:
                update_kwargs["is_active"] = args.active
            if args.verified is not None:
                update_kwargs["email_verified"] = args.verified
            
            update_user(args.email, **update_kwargs)
        elif args.command == "delete":
            delete_user(args.email)
        elif args.command == "reset-password":
            reset_password(args.email, args.new_password)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 