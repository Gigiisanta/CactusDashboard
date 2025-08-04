#!/usr/bin/env python3
"""
Script para crear todas las tablas de la base de datos.
"""

import sys
import os

# Agregar el directorio src al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from cactus_wealth.database import create_tables
from cactus_wealth.core.config import settings

def main():
    print("Creando tablas de la base de datos...")
    print(f"URL de la base de datos: {settings.DATABASE_URL}")
    
    try:
        create_tables()
        print("✅ Tablas creadas exitosamente!")
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 