#!/usr/bin/env python3
"""
Script para crear todas las tablas del modelo completo.
"""

import os
import sys

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy import text
from sqlmodel import SQLModel, create_engine

from cactus_wealth.core.config import settings

# Importar todos los modelos


def main():
    print("🏗️  Creando todas las tablas del modelo completo...")
    print(f"📝 URL de la base de datos: {settings.DATABASE_URL}")

    try:
        # Crear engine
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
        )

        # Crear todas las tablas
        print("📋 Creando tablas...")
        SQLModel.metadata.create_all(engine)

        # Verificar tablas creadas
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = [row[0] for row in result]
            print(f"✅ Tablas creadas: {tables}")

            # Contar registros en cada tabla
            for table in tables:
                try:
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = count_result.fetchone()[0]
                    print(f"   📊 {table}: {count} registros")
                except Exception as e:
                    print(f"   ⚠️  {table}: Error contando registros - {e}")

        print("🎉 ¡Todas las tablas creadas exitosamente!")

    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
