"""
Fixtures globales para testing del backend Cactus Wealth.
Configuración de base de datos de test, mocks y fixtures reutilizables.
"""

import inspect
import os
import re
import sys
from unittest.mock import AsyncMock, Mock

import pytest
import pytest_asyncio
import sqlalchemy
from fastapi import FastAPI
import asyncio
import inspect as _inspect
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy_utils import create_database, database_exists, drop_database
from sqlmodel import Session, SQLModel, create_engine

"""Asegurar path de `src` antes de importar el paquete de la app."""
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from cactus_wealth import database  # noqa: E402

os.environ["TESTING"] = "1"
os.environ.setdefault("PYTEST_ASYNCIO_MODE", "auto")

# Decide DB URL: smoke mode uses SQLite, otherwise Postgres (optionally xdist-suffixed)
SMOKE_MODE = os.getenv("PYTEST_SMOKE", "0") == "1"
default_pg = "postgresql://postgres:postgres@localhost:5432/cactus_test"
db_url = os.getenv("DATABASE_URL", default_pg)
if SMOKE_MODE:
    db_url = "sqlite:///./test_smoke.db"
os.environ["DATABASE_URL"] = db_url

# Create initial engine and bind it into the application database module
is_sqlite = db_url.startswith("sqlite")
if is_sqlite:
    # Ensure a clean SQLite file before creating the engine
    sqlite_path = db_url.replace("sqlite:///", "", 1)
    try:
        if os.path.exists(sqlite_path):
            os.remove(sqlite_path)
    except OSError:
        pass
    test_engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    test_engine = create_engine(db_url)
database._engine = test_engine
database.engine = test_engine

# Eliminar setup_test_db fixture y test_engine

# Eliminar pytest_sessionstart

# --- PATCH: Soporte xdist paralelo por base de datos ---
@pytest.fixture(scope="session", autouse=True)
def _setup_db_per_session() -> None:
    """Configure a clean database per test session.

    - In smoke mode (SQLite): drop and create all on the file DB.
    - In Postgres: optionally create xdist worker DBs, drop/create schema.
    """
    if is_sqlite:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        SQLModel.metadata.drop_all(engine)
        # De-duplicate index definitions by name to avoid double-creation
        for table in SQLModel.metadata.tables.values():
            seen_idx: set[str] = set()
            for idx in list(table.indexes):
                name = getattr(idx, "name", None)
                if name is None:
                    continue
                if name in seen_idx:
                    table.indexes.discard(idx)
                else:
                    seen_idx.add(name)
        SQLModel.metadata.create_all(engine)
        database._engine = engine
        database.engine = engine
        yield
        # Cleanup SQLite file between runs to avoid index collisions
        from contextlib import suppress
        with suppress(Exception):
            SQLModel.metadata.drop_all(engine)
    else:
        # Support xdist by creating per-worker databases
        worker_id = os.environ.get("PYTEST_XDIST_WORKER", "gw0")
        match = re.match(r"(.+/)([^/]+)$", db_url)
        if not match:
            raise RuntimeError(f"DATABASE_URL malformado: {db_url}")
        db_prefix, base_name = match.groups()
        worker_db = f"{db_prefix}{base_name}_{worker_id}"
        os.environ["DATABASE_URL"] = worker_db
        if not database_exists(worker_db):
            create_database(worker_db)
        engine = create_engine(worker_db)
        from contextlib import suppress
        with suppress(Exception):
            SQLModel.metadata.drop_all(engine)
        # De-duplicate index definitions by name to avoid double-creation
        for table in SQLModel.metadata.tables.values():
            seen_idx = set()
            for idx in list(table.indexes):
                name = getattr(idx, "name", None)
                if name is None:
                    continue
                if name in seen_idx:
                    table.indexes.discard(idx)
                else:
                    seen_idx.add(name)
        SQLModel.metadata.create_all(engine)
        database._engine = engine
        database.engine = engine
        yield
        drop_database(worker_db)


def pytest_configure(config):
    """Adjust pytest plugins for smoke runs.

    When PYTEST_SMOKE=1, disable coverage plugin to avoid global threshold failures
    during lightweight smoke testing.
    """
    if os.getenv("PYTEST_SMOKE") == "1":
        pm = config.pluginmanager
        cov = pm.get_plugin("cov")
        if cov:
            pm.unregister(cov)
        cov2 = pm.get_plugin("pytest_cov")
        if cov2:
            pm.unregister(cov2)


def pytest_collection_modifyitems(items):
    """Automatically mark async test functions with pytest.mark.asyncio.

    This makes async tests run without needing explicit decorators.
    """
    for item in items:
        test_func = getattr(item, "function", None)
        if test_func and inspect.iscoroutinefunction(test_func):
            item.add_marker(pytest.mark.asyncio)

@pytest.fixture(scope="function")
def session():
    engine = database._engine or create_engine(os.environ["DATABASE_URL"])
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def mock_session() -> Mock:
    """Mock de SQLModel Session para pruebas unitarias de repositorios."""
    session = Mock(spec=Session)
    session.add = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.delete = Mock()
    session.exec = Mock()
    session.close = Mock()
    return session


@pytest.fixture
def portfolio_repository(mock_session: Mock):
    """Repositorio de Portfolio con session mockeada."""
    from cactus_wealth.repositories.portfolio_repository import PortfolioRepository

    return PortfolioRepository(session=mock_session)


@pytest.fixture
def client_repository(mock_session: Mock):
    """Repositorio de Client con session mockeada."""
    from cactus_wealth.repositories.client_repository import ClientRepository

    return ClientRepository(session=mock_session)


@pytest.fixture
def asset_repository(mock_session: Mock):
    """Repositorio de Asset con session mockeada."""
    from cactus_wealth.repositories.asset_repository import AssetRepository

    return AssetRepository(session=mock_session)


@pytest.fixture
def user_repository(mock_session: Mock):
    """Repositorio de User con session mockeada."""
    from cactus_wealth.repositories.user_repository import UserRepository

    return UserRepository(session=mock_session)


@pytest.fixture
def notification_repository(mock_session: Mock):
    """Repositorio de Notification con session mockeada."""
    from cactus_wealth.repositories.notification_repository import (
        NotificationRepository,
    )

    return NotificationRepository(session=mock_session)


@pytest_asyncio.fixture
async def async_mock_session() -> AsyncMock:
    """Mock asíncrono de Session para pruebas async."""
    session = AsyncMock(spec=Session)
    session.add = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.exec = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture(scope="session")
def app() -> FastAPI:
    """FastAPI app for integration tests."""
    from cactus_wealth.main import app as main_app

    return main_app


@pytest.fixture
def client(app: FastAPI, request: pytest.FixtureRequest):
    """Client fixture compatible with both sync and async tests.

    - For async tests (coroutines), returns an httpx.AsyncClient bound to the ASGI app.
    - For sync tests, returns FastAPI's TestClient.
    """
    if _inspect.iscoroutinefunction(getattr(request, "function", None)):
        ac = AsyncClient(app=app, base_url="http://test")
        try:
            yield ac
        finally:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(ac.aclose())
                else:
                    loop.run_until_complete(ac.aclose())
            except RuntimeError:
                asyncio.run(ac.aclose())
        return
    # Sync path: manage context explicitly
    with TestClient(app) as tc:
        yield tc

@pytest.fixture
def test_client(app: FastAPI) -> TestClient:
    """Alias fixture explicitly named as test_client for integration tests."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user_credentials():
    """Credenciales de usuario de prueba."""
    return {"username": "test_user", "password": "test_password"}


@pytest.fixture(scope="function")
def test_admin(session):
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate
    from cactus_wealth.test_utils import create_user

    user_data = UserCreate(
        username="admin",
        email="admin@test.com",
        password="adminpass",
        role=UserRole.ADMIN,
    )
    return create_user(session=session, user_data=user_data)


@pytest.fixture(scope="function")
def test_user(session):
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate
    from cactus_wealth.test_utils import create_user

    user_data = UserCreate(
        username="test_user",
        email="user@test.com",
        password="testpass",
        role=UserRole.JUNIOR_ADVISOR,
    )
    return create_user(session=session, user_data=user_data)


@pytest.fixture(scope="function")
def another_user(session):
    from cactus_wealth.models import UserRole
    from cactus_wealth.schemas import UserCreate
    from cactus_wealth.test_utils import create_user

    user_data = UserCreate(
        username="another_user",
        email="another@test.com",
        password="anotherpass",
        role=UserRole.JUNIOR_ADVISOR,
    )
    return create_user(session=session, user_data=user_data)


@pytest.fixture(scope="function")
def test_client_db(session, test_user):
    from cactus_wealth.models import RiskProfile
    from cactus_wealth.schemas import ClientCreate
    from cactus_wealth.test_utils import create_client

    client_data = ClientCreate(
        first_name="Test",
        last_name="Client",
        email="client@test.com",
        risk_profile=RiskProfile.MEDIUM,
    )
    return create_client(session=session, client_data=client_data, owner_id=test_user.id)


@pytest.fixture(scope="function")
def authenticated_headers(test_user):
    """Bearer Authorization header for the created test user."""
    from cactus_wealth.security import create_access_token

    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


# Compatibility alias fixtures for test suites expecting specific names
@pytest.fixture
def db_session(session):
    return session


@pytest.fixture
def auth_headers(authenticated_headers):
    return authenticated_headers


@pytest.fixture(autouse=True, scope="function")
def cleanup_db(session):
    engine = session.get_bind()
    if engine.dialect.name == "postgresql":
        tables = session.execute(sqlalchemy.text("""
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        """)).scalars().all()
        if tables:
            session.execute(sqlalchemy.text(f'TRUNCATE TABLE {", ".join(tables)} RESTART IDENTITY CASCADE'))
            session.commit()
    elif engine.dialect.name == "sqlite":
        tables = session.execute(sqlalchemy.text("""
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
        """)).scalars().all()
        for table in tables:
            session.execute(sqlalchemy.text(f'DELETE FROM {table}'))
        session.commit()
