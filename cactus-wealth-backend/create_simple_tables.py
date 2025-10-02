#!/usr/bin/env python3
"""
Script simplificado para crear las tablas básicas de la base de datos.
"""

import os
import sys

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import SQLModel, create_engine

from cactus_wealth.core.config import settings

# Importar solo los modelos básicos
from cactus_wealth.models import EmailToken, User


def main():
    print("Creando tablas básicas de la base de datos...")
    print(f"URL de la base de datos: {settings.DATABASE_URL}")

    try:
        # Crear engine
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
        )

        # Crear solo las tablas básicas
        SQLModel.metadata.create_all(engine, tables=[
            User.__table__,
            EmailToken.__table__
        ])

        print("✅ Tablas básicas creadas exitosamente!")

        # Verificar que las tablas se crearon
        with engine.connect() as conn:
            result = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in result]
            print(f"Tablas creadas: {tables}")

    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
