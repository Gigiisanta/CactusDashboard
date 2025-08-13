"""
Insurance Policy Service module.
"""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from cactus_wealth import schemas
from cactus_wealth.core.logging_config import get_structured_logger
from cactus_wealth.models import Client, InsurancePolicy, User, UserRole
from cactus_wealth.repositories import ClientRepository, InsurancePolicyRepository

logger = get_structured_logger(__name__)


class InsurancePolicyService:
    """Service class for Insurance Policy business logic with authorization."""

    def __init__(self, db_session: Session):
        """Initialize the insurance policy service."""
        self.db = db_session
        self.insurance_policy_repo = InsurancePolicyRepository(db_session)
        self.client_repo = ClientRepository(db_session)

    def create_policy_for_client(
        self,
        policy_data: schemas.InsurancePolicyCreate,
        client_id: int,
        current_advisor: User,
    ) -> InsurancePolicy:
        """
        Create an insurance policy for a client with proper authorization.

        Args:
            policy_data: Insurance policy creation data
            client_id: ID of the client
            current_advisor: Current authenticated advisor

        Returns:
            Created InsurancePolicy instance

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        try:
            # Create the insurance policy
            return self.insurance_policy_repo.create_client_insurance_policy(
                policy_data=policy_data, client_id=client_id
            )
        except ValueError as e:
            # Policy number already exists
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        except IntegrityError as e:
            # DB-level uniqueness violation
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insurance policy already exists") from e
        except Exception as e:
            logger.error(
                f"Failed to create insurance policy for client {client_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create insurance policy: {str(e)}",
            ) from e

    def get_policy(self, policy_id: int, current_advisor: User) -> InsurancePolicy:
        """
        Get an insurance policy with proper authorization.

        Args:
            policy_id: ID of the insurance policy
            current_advisor: Current authenticated advisor

        Returns:
            InsurancePolicy instance

        Raises:
            HTTPException: If authorization fails or policy not found
        """
        # Get the policy
        policy = self.insurance_policy_repo.get_insurance_policy(policy_id=policy_id)
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found",
            )

        # Verify client ownership/access through the policy's client
        self._verify_client_access(policy.client_id, current_advisor)

        return policy

    def get_policies_by_client(
        self, client_id: int, current_advisor: User, skip: int = 0, limit: int = 100
    ) -> list[InsurancePolicy]:
        """
        Get all insurance policies for a client with proper authorization.

        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of InsurancePolicy instances

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        # Repository does not support pagination parameters
        _ = (skip, limit)
        return self.insurance_policy_repo.get_insurance_policies_by_client(
            client_id=client_id
        )

    def update_policy(
        self,
        policy_id: int,
        update_data: schemas.InsurancePolicyUpdate,
        current_advisor: User,
    ) -> InsurancePolicy:
        """
        Update an insurance policy with proper authorization.

        Args:
            policy_id: ID of the insurance policy
            update_data: Update data
            current_advisor: Current authenticated advisor

        Returns:
            Updated InsurancePolicy instance

        Raises:
            HTTPException: If authorization fails or policy not found
        """
        # Get and verify policy access
        self.get_policy(policy_id, current_advisor)

        try:
            updated = self.insurance_policy_repo.update_insurance_policy(
                policy_id=policy_id, policy_update=update_data
            )
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Insurance policy not found"
                )
            return updated
        except ValueError as e:
            # Policy number conflict
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        except Exception as e:
            logger.error(f"Failed to update insurance policy {policy_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update insurance policy: {str(e)}",
            ) from e

    def delete_policy(self, policy_id: int, current_advisor: User) -> InsurancePolicy:
        """
        Delete an insurance policy with proper authorization.

        Args:
            policy_id: ID of the insurance policy
            current_advisor: Current authenticated advisor

        Returns:
            Deleted InsurancePolicy instance

        Raises:
            HTTPException: If authorization fails or policy not found
        """
        # Get and verify policy access (this also checks authorization)
        policy = self.get_policy(policy_id, current_advisor)

        deleted = self.insurance_policy_repo.delete_insurance_policy(policy_id=policy_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found",
            )
        # Return the last known state
        return policy

    def _verify_client_access(self, client_id: int, current_advisor: User) -> Client:
        """
        Verify that the current advisor has access to the specified client.

        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor

        Returns:
            Client instance if access is granted

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = self.client_repo.get_client(client_id=client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
                )
            return client

        # Non-ADMIN users can only access their own clients
        client = self.client_repo.get_client(client_id=client_id)
        if not client or client.owner_id != current_advisor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage policies for your own clients.",
            )

        return client
