from datetime import datetime

from sqlalchemy import text
from sqlmodel import Session, create_engine

from cactus_wealth.models import User, UserRole
from cactus_wealth.security import get_password_hash

engine = create_engine("sqlite:///cactus-wealth-backend/cactus 2.db")

if __name__ == "__main__":
    with Session(engine) as session:
        # Eliminar usuario demo si existe
        session.exec(text("DELETE FROM users WHERE username='demo'"))
        session.commit()
        # Insertar usuario demo
        user = User(
            username="demo",
            email="demo@demo.com",
            hashed_password=get_password_hash("demo1234"),
            role=UserRole.admin if hasattr(UserRole, 'admin') else 'admin',
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(user)
        session.commit()
        print("Usuario demo insertado correctamente.")
