"""
Investment account repository for managing investment accounts.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .base_repository import BaseRepository
from cactus_wealth.models import InvestmentAccount


class InvestmentAccountRepository(BaseRepository[InvestmentAccount]):
    """Repository for InvestmentAccount model operations."""
    
    def __init__(self, db: Session):
        super().__init__(db, InvestmentAccount)
    
    def get_by_client_id(self, client_id: int) -> List[InvestmentAccount]:
        """Get all investment accounts for a specific client."""
        return self.db.query(InvestmentAccount).filter(InvestmentAccount.client_id == client_id).all()
    
    def get_by_account_type(self, account_type: str) -> List[InvestmentAccount]:
        """Get all investment accounts of a specific type."""
        return self.db.query(InvestmentAccount).filter(InvestmentAccount.account_type == account_type).all()
    
    def get_active_accounts(self) -> List[InvestmentAccount]:
        """Get all active investment accounts."""
        return self.db.query(InvestmentAccount).filter(InvestmentAccount.is_active == True).all()
    
    def search_accounts(self, query: str, client_id: Optional[int] = None) -> List[InvestmentAccount]:
        """Search investment accounts by name or account number."""
        filters = [
            or_(
                InvestmentAccount.name.ilike(f"%{query}%"),
                InvestmentAccount.account_number.ilike(f"%{query}%")
            )
        ]
        
        if client_id:
            filters.append(InvestmentAccount.client_id == client_id)
        
        return self.db.query(InvestmentAccount).filter(and_(*filters)).all()
    
    def get_total_balance_by_client(self, client_id: int) -> float:
        """Calculate total balance of all investment accounts for a client."""
        result = self.db.query(InvestmentAccount).filter(InvestmentAccount.client_id == client_id).all()
        return sum(account.current_balance for account in result if account.current_balance) 