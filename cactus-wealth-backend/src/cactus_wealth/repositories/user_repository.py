"""
User repository for user-related database operations.
"""

from sqlmodel import Session, select

from ..models import User, UserRole
from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User-related database operations."""

    def __init__(self, session: Session):
        super().__init__(session, User)

    def get_by_username(self, username: str) -> User | None:
        """
        Get a user by username.

        Args:
            username: The username to search for

        Returns:
            User if found, None otherwise
        """
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def get_by_email(self, email: str) -> User | None:
        """
        Get a user by email address.

        Args:
            email: The email address to search for

        Returns:
            User if found, None otherwise
        """
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_by_role(self, role: UserRole) -> list[User]:
        """
        Get all users with a specific role.

        Args:
            role: The user role to filter by

        Returns:
            List of users with the specified role
        """
        statement = select(User).where(User.role == role)
        return list(self.session.exec(statement).all())

    def get_active_users(self) -> list[User]:
        """
        Get all active users.

        Returns:
            List of active users
        """
        statement = select(User).where(User.is_active)
        return list(self.session.exec(statement).all())

    def get_advisors(self) -> list[User]:
        """
        Get all advisor users (senior and junior advisors).

        Returns:
            List of advisor users
        """
        statement = select(User).where(
            User.role.in_([role.value for role in [UserRole.SENIOR_ADVISOR, UserRole.JUNIOR_ADVISOR, UserRole.ADVISOR]])
        )
        return list(self.session.exec(statement).all())

    def get_advisors_by_manager(self, manager_id: int) -> list[User]:
        """
        Get all advisors assigned to a specific manager.

        Args:
            manager_id: The manager's user ID

        Returns:
            List of advisors under the manager
        """
        statement = select(User).where(
            User.manager_id == manager_id,
            User.role == UserRole.ADVISOR
        )
        return list(self.session.exec(statement).all())

    def assign_advisor(self, manager_id: int, advisor_id: int) -> bool:
        """
        Assign an advisor to a manager.

        Args:
            manager_id: The manager's user ID
            advisor_id: The advisor's user ID

        Returns:
            True if assignment was successful, False otherwise
        """
        advisor = self.get(advisor_id)
        if advisor and advisor.role == UserRole.ADVISOR:
            advisor.manager_id = manager_id
            self.session.add(advisor)
            self.session.commit()
            self.session.refresh(advisor)
            return True
        return False

    def remove_advisor(self, manager_id: int, advisor_id: int) -> bool:
        """
        Remove an advisor from a manager.

        Args:
            manager_id: The manager's user ID
            advisor_id: The advisor's user ID

        Returns:
            True if removal was successful, False otherwise
        """
        advisor = self.get(advisor_id)
        if advisor and advisor.manager_id == manager_id:
            advisor.manager_id = None
            self.session.add(advisor)
            self.session.commit()
            self.session.refresh(advisor)
            return True
        return False

    def get_unassigned_advisors(self) -> list[User]:
        """
        Get all advisors that are not assigned to any manager.

        Returns:
            List of unassigned advisors
        """
        statement = select(User).where(
            User.role == UserRole.ADVISOR,
            User.manager_id.is_(None)
        )
        return list(self.session.exec(statement).all())

    def update_profile(self, user_id: int, username: str | None = None) -> User | None:
        """
        Update user profile information.

        Args:
            user_id: The user's ID
            username: New username (optional)

        Returns:
            Updated user if successful, None otherwise
        """
        user = self.get(user_id)
        if not user:
            return None

        if username is not None:
            user.username = username

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
