#!/usr/bin/env python3
"""
Script para resetear completamente la base de datos.
"""

import os
import sqlite3
import sys

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from sqlmodel import create_engine

from cactus_wealth.core.config import settings


def main():
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

    # Crear tablas usando SQL directo
    with engine.connect() as conn:
        # Crear tabla users
        conn.execute(text("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(255) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL UNIQUE,
                hashed_password VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                role VARCHAR(50) DEFAULT 'ADVISOR',
                manager_id INTEGER,
                google_id VARCHAR(255),
                auth_provider VARCHAR(50) DEFAULT 'local',
                email_verified BOOLEAN DEFAULT 0,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY (manager_id) REFERENCES users (id)
            )
        """))

        # Crear tabla email_tokens
        conn.execute(text("""
            CREATE TABLE email_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token VARCHAR(255) NOT NULL UNIQUE,
                user_id INTEGER NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """))

        # Crear índices básicos
        conn.execute(text("CREATE INDEX ix_users_email ON users (email)"))
        conn.execute(text("CREATE INDEX ix_users_username ON users (username)"))
        conn.execute(text("CREATE INDEX ix_users_google_id ON users (google_id)"))
        conn.execute(text("CREATE INDEX ix_email_tokens_token ON email_tokens (token)"))
        conn.execute(text("CREATE INDEX ix_email_tokens_user_id ON email_tokens (user_id)"))

        conn.commit()

    print("✅ Base de datos reseteada exitosamente!")

    # Verificar tablas creadas
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        print(f"📋 Tablas creadas: {tables}")

if __name__ == "__main__":
    main()
