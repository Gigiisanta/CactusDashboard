"""
Insurance Policy Repository for handling insurance policy data operations.
"""

from typing import List, Optional
from sqlmodel import Session, select
from .base_repository import BaseRepository
from ..models import InsurancePolicy
from ..schemas import InsurancePolicyCreate, InsurancePolicyUpdate


class InsurancePolicyRepository(BaseRepository[InsurancePolicy]):
    """Repository for insurance policy operations."""

    def __init__(self, session: Session):
        super().__init__(session, InsurancePolicy)

    def get_insurance_policy(self, policy_id: int) -> Optional[InsurancePolicy]:
        """Get an insurance policy by ID."""
        return self.get_by_id(policy_id)

    def get_insurance_policies_by_client(self, client_id: int) -> List[InsurancePolicy]:
        """Get all insurance policies for a specific client."""
        statement = select(InsurancePolicy).where(InsurancePolicy.client_id == client_id)
        return list(self.session.exec(statement).all())

    def create_client_insurance_policy(
        self, policy_data: InsurancePolicyCreate, client_id: int
    ) -> InsurancePolicy:
        """Create a new insurance policy for a client."""
        policy_dict = policy_data.model_dump()
        policy_dict["client_id"] = client_id
        db_policy = InsurancePolicy(**policy_dict)
        
        return self.create(db_policy)

    def update_insurance_policy(
        self, policy_id: int, policy_update: InsurancePolicyUpdate
    ) -> Optional[InsurancePolicy]:
        """Update an insurance policy."""
        policy = self.get_by_id(policy_id)
        if not policy:
            return None
        
        update_data = policy_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(policy, field, value)
        
        return self.update(policy)

    def delete_insurance_policy(self, policy_id: int) -> bool:
        """Delete an insurance policy."""
        policy = self.get_by_id(policy_id)
        if not policy:
            return False
        
        self.delete(policy)
        return True