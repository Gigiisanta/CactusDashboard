"""
User Advisor Service for managing Manager-Advisor hierarchy.
"""


from ..models import User, UserRole
from ..repositories.client_repository import ClientRepository
from ..repositories.user_repository import UserRepository
from ..schemas import UserWithStats


class UserAdvisorService:
    """Service for managing advisor-manager relationships."""

    def __init__(self, user_repo: UserRepository, client_repo: ClientRepository):
        self.user_repo = user_repo
        self.client_repo = client_repo

    def link_advisor(self, manager_id: int, advisor_id: int) -> bool:
        """
        Link an advisor to a manager.

        Args:
            manager_id: The manager's user ID
            advisor_id: The advisor's user ID

        Returns:
            True if linking was successful, False otherwise

        Raises:
            ValueError: If manager or advisor roles are invalid
        """
        manager = self.user_repo.get(manager_id)
        advisor = self.user_repo.get(advisor_id)

        if not manager or manager.role != UserRole.MANAGER:
            raise ValueError("Invalid manager")

        if not advisor or advisor.role != UserRole.ADVISOR:
            raise ValueError("Invalid advisor")

        if advisor.manager_id is not None:
            raise ValueError("Advisor is already assigned to a manager")

        return self.user_repo.assign_advisor(manager_id, advisor_id)

    def unlink_advisor(self, manager_id: int, advisor_id: int) -> bool:
        """
        Unlink an advisor from a manager.

        Args:
            manager_id: The manager's user ID
            advisor_id: The advisor's user ID

        Returns:
            True if unlinking was successful, False otherwise

        Raises:
            ValueError: If manager or advisor roles are invalid
        """
        manager = self.user_repo.get(manager_id)
        advisor = self.user_repo.get(advisor_id)

        if not manager or manager.role != UserRole.MANAGER:
            raise ValueError("Invalid manager")

        if not advisor or advisor.role != UserRole.ADVISOR:
            raise ValueError("Invalid advisor")

        if advisor.manager_id != manager_id:
            raise ValueError("Advisor is not assigned to this manager")

        return self.user_repo.remove_advisor(manager_id, advisor_id)

    def list_advisors_with_stats(self, manager_id: int) -> list[UserWithStats]:
        """
        Get all advisors under a manager with their statistics.

        Args:
            manager_id: The manager's user ID

        Returns:
            List of advisors with their statistics

        Raises:
            ValueError: If manager role is invalid
        """
        manager = self.user_repo.get(manager_id)
        if not manager or manager.role != UserRole.MANAGER:
            raise ValueError("Invalid manager")

        advisors = self.user_repo.get_advisors_by_manager(manager_id)
        advisors_with_stats = []

        for advisor in advisors:
            n_clients = self.client_repo.count_clients_by_advisor(advisor.id)
            n_prospects = self.client_repo.count_prospects_by_advisor(advisor.id)
            aum_total = self.client_repo.sum_aum_by_advisor(advisor.id)

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
                n_clients=n_clients,
                n_prospects=n_prospects,
                aum_total=aum_total
            )
            advisors_with_stats.append(advisor_stats)

        return advisors_with_stats

    def get_unassigned_advisors(self) -> list[User]:
        """
        Get all advisors that are not assigned to any manager.

        Returns:
            List of unassigned advisors
        """
        return self.user_repo.get_unassigned_advisors()

    def get_advisor_stats(self, advisor_id: int) -> UserWithStats:
        """
        Get statistics for a specific advisor.

        Args:
            advisor_id: The advisor's user ID

        Returns:
            Advisor with statistics

        Raises:
            ValueError: If advisor is not found or invalid role
        """
        advisor = self.user_repo.get(advisor_id)
        if not advisor or advisor.role != UserRole.ADVISOR:
            raise ValueError("Invalid advisor")

        n_clients = self.client_repo.count_clients_by_advisor(advisor_id)
        n_prospects = self.client_repo.count_prospects_by_advisor(advisor_id)
        aum_total = self.client_repo.sum_aum_by_advisor(advisor_id)

        return UserWithStats(
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
            n_clients=n_clients,
            n_prospects=n_prospects,
            aum_total=aum_total
        )
