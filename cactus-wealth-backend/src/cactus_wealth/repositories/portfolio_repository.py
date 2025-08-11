"""
Portfolio repository for managing investment portfolios.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from .base_repository import BaseRepository
from cactus_wealth.models import Portfolio


class PortfolioRepository(BaseRepository[Portfolio]):
    """Repository for Portfolio model operations."""
    
    def __init__(self, db: Session):
        super().__init__(db, Portfolio)
    
    def get_by_client_id(self, client_id: int) -> List[Portfolio]:
        """Get all portfolios for a specific client."""
        return self.db.query(Portfolio).filter(Portfolio.client_id == client_id).all()
    
    def get_by_advisor_id(self, advisor_id: int) -> List[Portfolio]:
        """Get all portfolios managed by a specific advisor."""
        return self.db.query(Portfolio).filter(Portfolio.advisor_id == advisor_id).all()
    
    def get_active_portfolios(self) -> List[Portfolio]:
        """Get all active portfolios."""
        return self.db.query(Portfolio).filter(Portfolio.is_active == True).all()
    
    def search_portfolios(self, query: str, client_id: Optional[int] = None) -> List[Portfolio]:
        """Search portfolios by name or description."""
        filters = [
            or_(
                Portfolio.name.ilike(f"%{query}%"),
                Portfolio.description.ilike(f"%{query}%")
            )
        ]
        
        if client_id:
            filters.append(Portfolio.client_id == client_id)
        
        return self.db.query(Portfolio).filter(and_(*filters)).all()
    
    def get_portfolio_with_assets(self, portfolio_id: int) -> Optional[Portfolio]:
        """Get portfolio with its associated assets."""
        return self.db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    
    def get_total_value_by_client(self, client_id: int) -> float:
        """Calculate total value of all portfolios for a client."""
        result = self.db.query(Portfolio).filter(Portfolio.client_id == client_id).all()
        return sum(portfolio.total_value for portfolio in result if portfolio.total_value) 