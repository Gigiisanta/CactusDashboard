"""
Asset repository for managing financial assets.
"""


from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from cactus_wealth.models import Asset

from .base_repository import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for Asset model operations."""

    def __init__(self, db: Session):
        super().__init__(db, Asset)

    def get_by_portfolio_id(self, portfolio_id: int) -> list[Asset]:
        """Get all assets for a specific portfolio."""
        return self.db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()

    def get_by_client_id(self, client_id: int) -> list[Asset]:
        """Get all assets for a specific client."""
        return self.db.query(Asset).filter(Asset.client_id == client_id).all()

    def get_by_type(self, asset_type: str) -> list[Asset]:
        """Get all assets of a specific type."""
        return self.db.query(Asset).filter(Asset.asset_type == asset_type).all()

    def search_assets(self, query: str, client_id: int | None = None) -> list[Asset]:
        """Search assets by name or symbol."""
        filters = [
            or_(
                Asset.name.ilike(f"%{query}%"),
                Asset.symbol.ilike(f"%{query}%")
            )
        ]

        if client_id:
            filters.append(Asset.client_id == client_id)

        return self.db.query(Asset).filter(and_(*filters)).all()

    def get_total_value_by_portfolio(self, portfolio_id: int) -> float:
        """Calculate total value of all assets in a portfolio."""
        result = self.db.query(Asset).filter(Asset.portfolio_id == portfolio_id).all()
        return sum(asset.current_value for asset in result if asset.current_value)

    def get_total_value_by_client(self, client_id: int) -> float:
        """Calculate total value of all assets for a client."""
        result = self.db.query(Asset).filter(Asset.client_id == client_id).all()
        return sum(asset.current_value for asset in result if asset.current_value)
