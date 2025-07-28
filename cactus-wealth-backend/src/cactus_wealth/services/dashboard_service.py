"""
Dashboard Service for providing dashboard metrics based on user role.
"""

from typing import List

from ..models import User, UserRole
from ..repositories.user_repository import UserRepository
from ..repositories.client_repository import ClientRepository
from ..schemas import DashboardMetrics, UserWithStats


class DashboardService:
    """Service for providing dashboard metrics."""

    def __init__(self, user_repo: UserRepository, client_repo: ClientRepository):
        self.user_repo = user_repo
        self.client_repo = client_repo

    def get_dashboard_metrics(self, user_id: int, role: UserRole) -> DashboardMetrics:
        """
        Get dashboard metrics based on user role.

        Args:
            user_id: The user's ID
            role: The user's role

        Returns:
            Dashboard metrics appropriate for the user's role

        Raises:
            ValueError: If user is not found or role is invalid
        """
        user = self.user_repo.get(user_id)
        if not user:
            raise ValueError("User not found")

        if role == UserRole.ADVISOR:
            return self._get_advisor_metrics(user_id)
        elif role == UserRole.MANAGER:
            return self._get_manager_metrics(user_id)
        else:
            raise ValueError(f"Unsupported role for dashboard metrics: {role}")

    def _get_advisor_metrics(self, advisor_id: int) -> DashboardMetrics:
        """
        Get dashboard metrics for an advisor (personal stats only).

        Args:
            advisor_id: The advisor's user ID

        Returns:
            Dashboard metrics for the advisor
        """
        n_clients = self.client_repo.count_clients_by_advisor(advisor_id)
        n_prospects = self.client_repo.count_prospects_by_advisor(advisor_id)
        aum_total = self.client_repo.sum_aum_by_advisor(advisor_id)

        return DashboardMetrics(
            n_clients=n_clients,
            n_prospects=n_prospects,
            aum_total=aum_total,
            advisors=[]  # Advisors don't see other advisors
        )

    def _get_manager_metrics(self, manager_id: int) -> DashboardMetrics:
        """
        Get dashboard metrics for a manager (personal + team stats).

        Args:
            manager_id: The manager's user ID

        Returns:
            Dashboard metrics for the manager including team stats
        """
        # Manager's personal stats
        n_clients = self.client_repo.count_clients_by_advisor(manager_id)
        n_prospects = self.client_repo.count_prospects_by_advisor(manager_id)
        aum_total = self.client_repo.sum_aum_by_advisor(manager_id)

        # Get advisors under this manager with their stats
        advisors = self.user_repo.get_advisors_by_manager(manager_id)
        advisors_with_stats = []

        for advisor in advisors:
            advisor_n_clients = self.client_repo.count_clients_by_advisor(advisor.id)
            advisor_n_prospects = self.client_repo.count_prospects_by_advisor(advisor.id)
            advisor_aum_total = self.client_repo.sum_aum_by_advisor(advisor.id)

            # Add advisor stats to manager's totals
            n_clients += advisor_n_clients
            n_prospects += advisor_n_prospects
            aum_total += advisor_aum_total

            advisor_stats = UserWithStats(
                id=advisor.id,
                email=advisor.email,
                username=advisor.username,
                is_active=advisor.is_active,
                role=advisor.role,
                google_id=advisor.google_id,
                auth_provider=advisor.auth_provider,
                created_at=advisor.created_at,
                updated_at=advisor.updated_at,
                manager_id=advisor.manager_id,
                n_clients=advisor_n_clients,
                n_prospects=advisor_n_prospects,
                aum_total=advisor_aum_total
            )
            advisors_with_stats.append(advisor_stats)

        return DashboardMetrics(
            n_clients=n_clients,
            n_prospects=n_prospects,
            aum_total=aum_total,
            advisors=advisors_with_stats
        )