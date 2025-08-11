"""Test utilities module for CactusDashboard backend.

This module provides utility functions for testing,
replacing the deprecated crud.py module.
"""

from sqlmodel import Session

from .core.crypto import get_password_hash
from .repositories import (
    ClientRepository,
    InsurancePolicyRepository,
    InvestmentAccountRepository,
    UserRepository,
)
from .schemas import (
    ClientCreate,
    InsurancePolicyCreate,
    InvestmentAccountCreate,
    UserCreate,
)


def create_user(session: Session, user_data: UserCreate) -> object:
    """Create a new user for testing purposes."""
    user_repo = UserRepository(session)

    # Hash the password
    hashed_password = get_password_hash(user_data.password)

    # Create user dict with hashed password
    user_dict = user_data.model_dump()
    user_dict["hashed_password"] = hashed_password
    del user_dict["password"]  # Remove plain password

    # Create user using repository
    from .models import User
    db_user = User(**user_dict)
    return user_repo.create(db_user)


def create_client(session: Session, client_data: ClientCreate, owner_id: int) -> object:
    """Create a new client for testing purposes."""
    client_repo = ClientRepository(session)

    # Create client dict with owner_id
    client_dict = client_data.model_dump()
    client_dict["owner_id"] = owner_id

    # Create client using repository
    from .models import Client
    db_client = Client(**client_dict)
    return client_repo.create(db_client)


def create_client_investment_account(session: Session, account_data: InvestmentAccountCreate, client_id: int) -> object:
    """Create a new investment account for a client for testing purposes."""
    account_repo = InvestmentAccountRepository(session)
    return account_repo.create_client_investment_account(account_data, client_id)


def create_client_insurance_policy(session: Session, policy_data: InsurancePolicyCreate, client_id: int) -> object:
    """Create a new insurance policy for a client for testing purposes."""
    policy_repo = InsurancePolicyRepository(session)
    return policy_repo.create_client_insurance_policy(policy_data, client_id)


def remove_client(session: Session, client_id: int, owner_id: int) -> object:
    """Remove a client for testing purposes."""
    client_repo = ClientRepository(session)

    # First verify the client belongs to the owner
    client = client_repo.verify_advisor_access(client_id, owner_id)
    if not client:
        return None

    # Delete the client (cascade will handle related records)
    return client_repo.delete(client_id)
