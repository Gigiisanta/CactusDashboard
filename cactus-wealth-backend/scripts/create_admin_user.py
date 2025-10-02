#!/usr/bin/env python3
"""
Crear (o actualizar) el usuario 'admin' con contraseña 'admin' y rol ADMIN.
"""

import sys
from datetime import datetime
from pathlib import Path

# Agregar el directorio src al path para importar los módulos
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sqlmodel import Session, select  # type: ignore

from cactus_wealth.core.crypto import get_password_hash  # type: ignore
from cactus_wealth.database import get_engine  # type: ignore
from cactus_wealth.models import User, UserRole  # type: ignore


def upsert_admin_user() -> None:
  engine = get_engine()
  with Session(engine) as session:
    existing = session.exec(select(User).where(User.username == "admin")).first()
    if existing:
      existing.email = "admin@cactuswealth.com"
      existing.hashed_password = get_password_hash("admin")
      existing.role = UserRole.ADMIN
      existing.is_active = True
      existing.updated_at = datetime.utcnow()
      session.add(existing)
      session.commit()
      print("✅ Usuario 'admin' actualizado (rol=ADMIN)")
      return

    user = User(
      username="admin",
      email="admin@cactuswealth.com",
      hashed_password=get_password_hash("admin"),
      role=UserRole.ADMIN,
      is_active=True,
      created_at=datetime.utcnow(),
      updated_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    print("✅ Usuario 'admin' creado (rol=ADMIN)")


if __name__ == "__main__":
  upsert_admin_user()


