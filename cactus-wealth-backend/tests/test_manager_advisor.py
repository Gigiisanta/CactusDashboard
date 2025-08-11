"""
Tests for Manager-Advisor hierarchy functionality.
"""

import pytest
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from cactus_wealth.models import Client, ClientStatus, User, UserRole
from cactus_wealth.repositories.client_repository import ClientRepository
from cactus_wealth.repositories.user_repository import UserRepository
from cactus_wealth.services.dashboard_service import DashboardService
from cactus_wealth.services.user_advisor_service import UserAdvisorService


@pytest.fixture
def session():
    """Create a test database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create tables
    from cactus_wealth.models import SQLModel
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture
def user_repo(session):
    """Create a user repository."""
    return UserRepository(session)


@pytest.fixture
def client_repo(session):
    """Create a client repository."""
    return ClientRepository(session)


@pytest.fixture
def user_advisor_service(user_repo, client_repo):
    """Create a user advisor service."""
    return UserAdvisorService(user_repo, client_repo)


@pytest.fixture
def dashboard_service(user_repo, client_repo):
    """Create a dashboard service."""
    return DashboardService(user_repo, client_repo)


@pytest.fixture
def manager_user(session):
    """Create a manager user."""
    manager = User(
        email="manager@test.com",
        username="manager",
        hashed_password="hashed_password",
        role=UserRole.MANAGER,
        is_active=True
    )
    session.add(manager)
    session.commit()
    session.refresh(manager)
    return manager


@pytest.fixture
def advisor_user(session):
    """Create an advisor user."""
    advisor = User(
        email="advisor@test.com",
        username="advisor",
        hashed_password="hashed_password",
        role=UserRole.ADVISOR,
        is_active=True
    )
    session.add(advisor)
    session.commit()
    session.refresh(advisor)
    return advisor


@pytest.fixture
def another_advisor_user(session):
    """Create another advisor user."""
    advisor = User(
        email="advisor2@test.com",
        username="advisor2",
        hashed_password="hashed_password",
        role=UserRole.ADVISOR,
        is_active=True
    )
    session.add(advisor)
    session.commit()
    session.refresh(advisor)
    return advisor


class TestUserAdvisorService:
    """Test cases for UserAdvisorService."""

    def test_link_advisor_success(self, user_advisor_service, manager_user, advisor_user):
        """Test successful advisor linking."""
        result = user_advisor_service.link_advisor(manager_user.id, advisor_user.id)
        assert result is True

    def test_link_advisor_invalid_manager(self, user_advisor_service, advisor_user, another_advisor_user):
        """Test linking with invalid manager role."""
        with pytest.raises(ValueError, match="Invalid manager"):
            user_advisor_service.link_advisor(advisor_user.id, another_advisor_user.id)

    def test_link_advisor_invalid_advisor(self, user_advisor_service, manager_user):
        """Test linking with invalid advisor role."""
        with pytest.raises(ValueError, match="Invalid advisor"):
            user_advisor_service.link_advisor(manager_user.id, manager_user.id)

    def test_link_advisor_already_assigned(self, user_advisor_service, manager_user, advisor_user, session):
        """Test linking advisor that is already assigned."""
        # First assignment
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)

        # Create another manager
        another_manager = User(
            email="manager2@test.com",
            username="manager2",
            hashed_password="hashed_password",
            role=UserRole.MANAGER,
            is_active=True
        )
        session.add(another_manager)
        session.commit()
        session.refresh(another_manager)

        # Try to assign the same advisor to another manager
        with pytest.raises(ValueError, match="Advisor is already assigned to a manager"):
            user_advisor_service.link_advisor(another_manager.id, advisor_user.id)

    def test_unlink_advisor_success(self, user_advisor_service, manager_user, advisor_user):
        """Test successful advisor unlinking."""
        # First link the advisor
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)

        # Then unlink
        result = user_advisor_service.unlink_advisor(manager_user.id, advisor_user.id)
        assert result is True

    def test_unlink_advisor_not_assigned(self, user_advisor_service, manager_user, advisor_user):
        """Test unlinking advisor that is not assigned to the manager."""
        with pytest.raises(ValueError, match="Advisor is not assigned to this manager"):
            user_advisor_service.unlink_advisor(manager_user.id, advisor_user.id)

    def test_list_advisors_with_stats(self, user_advisor_service, manager_user, advisor_user, session):
        """Test listing advisors with statistics."""
        # Link advisor to manager
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)

        # Create some clients for the advisor
        client1 = Client(
            first_name="John",
            last_name="Doe",
            email="john@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.ACTIVE
        )
        client2 = Client(
            first_name="Jane",
            last_name="Smith",
            email="jane@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.PROSPECT
        )
        session.add_all([client1, client2])
        session.commit()

        # Get advisors with stats
        advisors = user_advisor_service.list_advisors_with_stats(manager_user.id)

        assert len(advisors) == 1
        advisor_stats = advisors[0]
        assert advisor_stats.id == advisor_user.id
        assert advisor_stats.n_clients == 1  # Only ACTIVE clients
        assert advisor_stats.n_prospects == 1  # Only PROSPECT clients
        assert advisor_stats.aum_total == 0.0  # No investment accounts

    def test_get_unassigned_advisors(self, user_advisor_service, advisor_user, another_advisor_user, manager_user):
        """Test getting unassigned advisors."""
        # Initially both advisors are unassigned
        unassigned = user_advisor_service.get_unassigned_advisors()
        assert len(unassigned) == 2

        # Assign one advisor
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)

        # Now only one should be unassigned
        unassigned = user_advisor_service.get_unassigned_advisors()
        assert len(unassigned) == 1
        assert unassigned[0].id == another_advisor_user.id


class TestDashboardService:
    """Test cases for DashboardService."""

    def test_get_advisor_metrics(self, dashboard_service, advisor_user, session):
        """Test getting dashboard metrics for an advisor."""
        # Create some clients for the advisor
        client1 = Client(
            first_name="John",
            last_name="Doe",
            email="john@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.ACTIVE
        )
        client2 = Client(
            first_name="Jane",
            last_name="Smith",
            email="jane@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.PROSPECT
        )
        session.add_all([client1, client2])
        session.commit()

        # Get metrics
        metrics = dashboard_service.get_dashboard_metrics(advisor_user.id, UserRole.ADVISOR)

        assert metrics.n_clients == 1
        assert metrics.n_prospects == 1
        assert metrics.aum_total == 0.0
        assert len(metrics.advisors) == 0  # Advisors don't see other advisors

    def test_get_manager_metrics(self, dashboard_service, manager_user, advisor_user, user_advisor_service, session):
        """Test getting dashboard metrics for a manager."""
        # Link advisor to manager
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)

        # Create clients for both manager and advisor
        manager_client = Client(
            first_name="Manager",
            last_name="Client",
            email="manager_client@test.com",
            owner_id=manager_user.id,
            status=ClientStatus.ACTIVE
        )
        advisor_client = Client(
            first_name="Advisor",
            last_name="Client",
            email="advisor_client@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.ACTIVE
        )
        session.add_all([manager_client, advisor_client])
        session.commit()

        # Get metrics
        metrics = dashboard_service.get_dashboard_metrics(manager_user.id, UserRole.MANAGER)

        assert metrics.n_clients == 2  # Manager's + advisor's clients
        assert metrics.n_prospects == 0
        assert metrics.aum_total == 0.0
        assert len(metrics.advisors) == 1  # Manager sees their advisors

        advisor_stats = metrics.advisors[0]
        assert advisor_stats.id == advisor_user.id
        assert advisor_stats.n_clients == 1
        assert advisor_stats.n_prospects == 0

    def test_unsupported_role(self, dashboard_service, session):
        """Test dashboard metrics with unsupported role."""
        # Create a user with unsupported role
        god_user = User(
            email="god@test.com",
            username="god",
            hashed_password="hashed_password",
            role=UserRole.GOD,
            is_active=True
        )
        session.add(god_user)
        session.commit()
        session.refresh(god_user)

        with pytest.raises(ValueError, match="Unsupported role for dashboard metrics"):
            dashboard_service.get_dashboard_metrics(god_user.id, UserRole.GOD)


class TestManagerAdvisorSecurity:
    """Test security aspects of Manager-Advisor hierarchy."""

    def test_advisor_cannot_see_other_advisors(self, dashboard_service, advisor_user, another_advisor_user, session):
        """Test that an advisor cannot see other advisors' data."""
        # Create clients for both advisors
        client1 = Client(
            first_name="Client1",
            last_name="Test",
            email="client1@test.com",
            owner_id=advisor_user.id,
            status=ClientStatus.ACTIVE
        )
        client2 = Client(
            first_name="Client2",
            last_name="Test",
            email="client2@test.com",
            owner_id=another_advisor_user.id,
            status=ClientStatus.ACTIVE
        )
        session.add_all([client1, client2])
        session.commit()

        # Get metrics for first advisor
        metrics = dashboard_service.get_dashboard_metrics(advisor_user.id, UserRole.ADVISOR)

        # Should only see their own data
        assert metrics.n_clients == 1
        assert len(metrics.advisors) == 0

    def test_manager_only_sees_assigned_advisors(self, dashboard_service, user_advisor_service, manager_user, advisor_user, another_advisor_user, session):
        """Test that a manager only sees their assigned advisors."""
        # Create another manager
        another_manager = User(
            email="manager2@test.com",
            username="manager2",
            hashed_password="hashed_password",
            role=UserRole.MANAGER,
            is_active=True
        )
        session.add(another_manager)
        session.commit()
        session.refresh(another_manager)

        # Assign advisors to different managers
        user_advisor_service.link_advisor(manager_user.id, advisor_user.id)
        user_advisor_service.link_advisor(another_manager.id, another_advisor_user.id)

        # Get metrics for first manager
        metrics = dashboard_service.get_dashboard_metrics(manager_user.id, UserRole.MANAGER)

        # Should only see their own advisor
        assert len(metrics.advisors) == 1
        assert metrics.advisors[0].id == advisor_user.id
