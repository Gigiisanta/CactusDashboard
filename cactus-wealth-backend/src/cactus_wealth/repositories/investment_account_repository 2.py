"""
Investment Account Repository for handling investment account data operations.
"""


from sqlmodel import Session, select

from ..models import InvestmentAccount
from ..schemas import InvestmentAccountCreate, InvestmentAccountUpdate
from .base_repository import BaseRepository


class InvestmentAccountRepository(BaseRepository[InvestmentAccount]):
    """Repository for investment account operations."""

    def __init__(self, session: Session):
        super().__init__(session, InvestmentAccount)

    def get_investment_account(self, account_id: int) -> InvestmentAccount | None:
        """Get an investment account by ID."""
        return self.get_by_id(account_id)

    def get_investment_accounts_by_client(self, client_id: int) -> list[InvestmentAccount]:
        """Get all investment accounts for a specific client."""
        statement = select(InvestmentAccount).where(InvestmentAccount.client_id == client_id)
        return list(self.session.exec(statement).all())

    def create_client_investment_account(
        self, account_data: InvestmentAccountCreate, client_id: int
    ) -> InvestmentAccount:
        """Create a new investment account for a client."""
        account_dict = account_data.model_dump()
        account_dict["client_id"] = client_id
        db_account = InvestmentAccount(**account_dict)

        return self.create(db_account)

    def update_investment_account(
        self, account_id: int, account_update: InvestmentAccountUpdate
    ) -> InvestmentAccount | None:
        """Update an investment account."""
        account = self.get_by_id(account_id)
        if not account:
            return None

        update_data = account_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)

        return self.update(account)

    def delete_investment_account(self, account_id: int) -> bool:
        """Delete an investment account."""
        account = self.get_by_id(account_id)
        if not account:
            return False

        self.delete(account)
        return True
