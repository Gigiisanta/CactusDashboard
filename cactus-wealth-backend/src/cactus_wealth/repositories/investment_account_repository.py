"""
Investment account repository for managing investment accounts.
"""


from sqlalchemy import and_, or_
from sqlmodel import Session, select

from ..models import InvestmentAccount

from .base_repository import BaseRepository


class InvestmentAccountRepository(BaseRepository[InvestmentAccount]):
    """Repository for InvestmentAccount model operations."""

    def __init__(self, session: Session):
        super().__init__(session, InvestmentAccount)

    def get_by_client_id(self, client_id: int) -> list[InvestmentAccount]:
        """Get all investment accounts for a specific client."""
        statement = select(InvestmentAccount).where(InvestmentAccount.client_id == client_id)
        return list(self.session.exec(statement).all())

    def get_by_account_type(self, account_type: str) -> list[InvestmentAccount]:
        """Get all investment accounts of a specific type."""
        statement = select(InvestmentAccount).where(InvestmentAccount.account_type == account_type)
        return list(self.session.exec(statement).all())

    def get_active_accounts(self) -> list[InvestmentAccount]:
        """Get all active investment accounts."""
        statement = select(InvestmentAccount).where(InvestmentAccount.is_active == True)  # noqa: E712
        return list(self.session.exec(statement).all())

    def search_accounts(self, query: str, client_id: int | None = None) -> list[InvestmentAccount]:
        """Search investment accounts by name or account number."""
        filters = [
            or_(
                InvestmentAccount.name.ilike(f"%{query}%"),
                InvestmentAccount.account_number.ilike(f"%{query}%")
            )
        ]

        if client_id:
            filters.append(InvestmentAccount.client_id == client_id)

        statement = select(InvestmentAccount).where(and_(*filters))
        return list(self.session.exec(statement).all())

    def get_total_balance_by_client(self, client_id: int) -> float:
        """Calculate total balance of all investment accounts for a client."""
        statement = select(InvestmentAccount).where(InvestmentAccount.client_id == client_id)
        result = self.session.exec(statement).all()
        return sum(account.current_balance for account in result if getattr(account, "current_balance", None))

    def create_client_investment_account(self, account_data, client_id: int) -> InvestmentAccount:
        """Create new investment account from schema and client_id (compat for tests)."""
        account_dict = account_data.model_dump()
        account_dict["client_id"] = client_id
        account = InvestmentAccount(**account_dict)
        return self.create(account)
