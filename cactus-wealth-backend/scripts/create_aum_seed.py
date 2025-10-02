#!/usr/bin/env python3
"""
Seed minimal data: create GOD user 'gio/gigi123' and 2 PortfolioSnapshot rows
for quick AUM chart smoke tests. SQLite/Postgres-safe table checks.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from sqlalchemy import text
from sqlmodel import Session

from cactus_wealth.core.crypto import get_password_hash
from cactus_wealth.database import get_engine
from cactus_wealth.models import Client, Portfolio, PortfolioSnapshot, User, UserRole


def table_exists(session: Session, table: str) -> bool:
    try:
        # Try Postgres-style information_schema first
        res = session.exec(text(
            "SELECT table_name FROM information_schema.tables WHERE table_name = :t"
        ), {"t": table}).first()
        if res:
            return True
        raise RuntimeError("fallback")
    except Exception:
        # Generic fallback (works on SQLite)
        try:
            session.exec(text(f"SELECT 1 FROM {table} LIMIT 1"))
            return True
        except Exception:
            return False


def ensure_god_user(session: Session) -> User:
    user = session.exec(text("SELECT id, username FROM users WHERE username='gio'"))
    row = user.first()
    if row:
        u = session.get(User, row[0] if isinstance(row, tuple) else row.id)
        if u:
            return u
    u = User(
        username="gio",
        email="gio@cactuswealth.com",
        hashed_password=get_password_hash("gigi123"),
        role=UserRole.GOD if hasattr(UserRole, "GOD") else UserRole.ADMIN,
        is_active=True,
        email_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(u)
    session.commit()
    session.refresh(u)
    return u


def main() -> None:
    engine = get_engine()
    with Session(engine) as session:
        # Basic existence guard
        required = ["users", "clients", "portfolios", "portfolio_snapshots"]
        for t in required:
            if not table_exists(session, t):
                print(f"❌ Missing table: {t}. Run migrations or create tables.")
                return

        # Ensure GOD user
        user = ensure_god_user(session)

        # Create a client and portfolio for that user if none exist
        client = session.exec(text("SELECT id FROM clients WHERE owner_id = :oid LIMIT 1"), {"oid": user.id}).first()
        if client:
            client_id = int(client[0] if isinstance(client, tuple) else client.id)
        else:
            c = Client(first_name="Demo", last_name="User", email=f"demo-{user.id}@example.com", owner_id=user.id)
            session.add(c)
            session.commit()
            session.refresh(c)
            client_id = c.id

        portfolio = session.exec(text("SELECT id FROM portfolios WHERE client_id = :cid LIMIT 1"), {"cid": client_id}).first()
        if portfolio:
            portfolio_id = int(portfolio[0] if isinstance(portfolio, tuple) else portfolio.id)
        else:
            p = Portfolio(name="Demo Portfolio", client_id=client_id)
            session.add(p)
            session.commit()
            session.refresh(p)
            portfolio_id = p.id

        # Insert two snapshots for yesterday and today
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)

        session.add(PortfolioSnapshot(portfolio_id=portfolio_id, value=100000, timestamp=yesterday))
        session.add(PortfolioSnapshot(portfolio_id=portfolio_id, value=101000, timestamp=now))
        session.commit()
        print("✅ Seeded GOD user and AUM snapshots")


if __name__ == "__main__":
    main()


