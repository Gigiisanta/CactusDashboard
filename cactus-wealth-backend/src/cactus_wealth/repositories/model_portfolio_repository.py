from typing import Optional
from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from ..models import ModelPortfolio, ModelPortfolioPosition, Asset
from .base_repository import BaseRepository

class ModelPortfolioRepository(BaseRepository[ModelPortfolio]):
    def __init__(self, session: Session):
        super().__init__(session, ModelPortfolio)

    def get_with_positions(self, portfolio_id: int) -> Optional[ModelPortfolio]:
        statement = (
            select(ModelPortfolio)
            .where(ModelPortfolio.id == portfolio_id)
            .options(selectinload(ModelPortfolio.positions).selectinload(ModelPortfolioPosition.asset))
        )
        return self.session.exec(statement).first()

    def get_all_with_positions(self, skip: int = 0, limit: int = 100) -> list[ModelPortfolio]:
        statement = (
            select(ModelPortfolio)
            .options(selectinload(ModelPortfolio.positions).selectinload(ModelPortfolioPosition.asset))
            .offset(skip)
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def create_position(self, position: ModelPortfolioPosition) -> ModelPortfolioPosition:
        self.session.add(position)
        self.session.commit()
        self.session.refresh(position)
        return position

    def update_position(self, position: ModelPortfolioPosition) -> ModelPortfolioPosition:
        self.session.add(position)
        self.session.commit()
        self.session.refresh(position)
        return position

    def delete_position(self, position: ModelPortfolioPosition) -> ModelPortfolioPosition:
        self.session.delete(position)
        self.session.commit()
        return position

    def total_weight(self, portfolio_id: int) -> float:
        result = self.session.exec(
            select(func.sum(ModelPortfolioPosition.weight)).where(
                ModelPortfolioPosition.model_portfolio_id == portfolio_id
            )
        ).first()
        return float(result) if result else 0.0 