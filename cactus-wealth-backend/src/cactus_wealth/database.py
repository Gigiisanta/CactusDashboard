from collections.abc import Generator

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, StaticPool, create_engine

from cactus_wealth.core.config import settings

_engine: Engine | None = None


def get_engine(db_url: str | None = None) -> Engine:
    global _engine
    if _engine is not None:
        return _engine
    db_url = db_url or settings.DATABASE_URL
    if "sqlite" in db_url:
        _engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        _engine = create_engine(
            db_url,
            echo=False,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_pre_ping=settings.DB_POOL_PRE_PING,
            pool_recycle=settings.DB_POOL_RECYCLE,
            connect_args={
                "connect_timeout": settings.CONNECTION_TIMEOUT,
                "application_name": "cactus_wealth_backend",
            },
        )
    return _engine


def create_tables() -> None:
    """Create all tables in the database."""
    # Import models to register them with the cleared metadata

    # Create tables
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session with proper transaction handling."""
    session = Session(get_engine(), autoflush=True, autocommit=False)
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """Alias for get_session for compatibility."""
    return get_session()
