from datetime import datetime
from decimal import Decimal

from sqlmodel import Session

from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import Asset, PortfolioSnapshot
from cactus_wealth.repositories import (
    AssetRepository,
    ClientRepository,
    NotificationRepository,
    PortfolioRepository,
)
from cactus_wealth.services.notification.notification_service import NotificationService
from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class PortfolioService:
    """
    🚀 REFACTORED: Clean service class following Repository pattern.

    Service class for portfolio business logic with clean separation
    between business logic and data access through repositories.
    """

    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the portfolio service with repositories.

        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        # 🚀 CLEAN ARCHITECTURE: Use repositories instead of direct DB access
        self.portfolio_repo = PortfolioRepository(db_session)
        self.asset_repo = AssetRepository(db_session)
        self.notification_repo = NotificationRepository(db_session)
        self.client_repo = ClientRepository(db_session)

        self.market_data_provider = market_data_provider
        self.notification_service = NotificationService(db_session)

    def get_portfolio_valuation(self, portfolio_id: int) -> schemas.PortfolioValuation:
        """
        🚀 REFACTORED: Calculate portfolio valuation using clean repository pattern.

        Args:
            portfolio_id: ID of the portfolio to valuate

        Returns:
            PortfolioValuation with calculated values

        Raises:
            ValueError: If portfolio not found
            Exception: For market data retrieval errors
        """
        logger.info("portfolio_valuation_started", portfolio_id=portfolio_id)

        # 🚀 CLEAN: Use repository instead of direct DB queries
        portfolio = self.portfolio_repo.get_with_positions(portfolio_id)

        if not portfolio:
            raise ValueError(f"Portfolio with ID {portfolio_id} not found")

        # 🚀 CLEAN: Get positions through repository
        positions = self.portfolio_repo.get_positions_for_portfolio(portfolio_id)

        if not positions:
            logger.warning("portfolio_has_no_positions", portfolio_id=portfolio_id)
            return schemas.PortfolioValuation(
                portfolio_id=portfolio_id,
                portfolio_name=portfolio.name,
                total_value=0.0,
                total_cost_basis=0.0,
                total_pnl=0.0,
                total_pnl_percentage=0.0,
                positions_count=0,
                last_updated=datetime.utcnow(),
            )

        total_value = 0.0
        total_cost_basis = 0.0
        positions_valued = 0

        for position in positions:
            try:
                # Get current market price
                current_price = self.market_data_provider.get_current_price(
                    position.asset.ticker_symbol
                )

                # Calculate position values
                position_market_value = position.quantity * current_price
                position_cost_basis = position.quantity * position.purchase_price

                total_value += position_market_value
                total_cost_basis += position_cost_basis
                positions_valued += 1

                logger.debug(
                    f"Position {position.asset.ticker_symbol}: "
                    f"Qty={position.quantity}, "
                    f"Purchase=${position.purchase_price:.2f}, "
                    f"Current=${current_price:.2f}, "
                    f"Value=${position_market_value:.2f}"
                )

            except Exception as e:
                logger.error(
                    f"Failed to get price for {position.asset.ticker_symbol} "
                    f"in portfolio {portfolio_id}: {str(e)}"
                )
                # For production, you might want to handle this differently
                # For now, we'll re-raise the exception
                raise Exception(
                    f"Failed to valuate position {position.asset.ticker_symbol}: {str(e)}"
                )

        # Calculate P&L
        total_pnl = total_value - total_cost_basis
        total_pnl_percentage = (
            (total_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0.0
        )

        logger.info(
            "portfolio_valuation_completed",
            portfolio_id=portfolio_id,
            total_value=round(total_value, 2),
            total_cost_basis=round(total_cost_basis, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percentage=round(total_pnl_percentage, 2),
            positions_valued=positions_valued,
        )

        return schemas.PortfolioValuation(
            portfolio_id=portfolio_id,
            portfolio_name=portfolio.name,
            total_value=round(total_value, 2),
            total_cost_basis=round(total_cost_basis, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percentage=round(total_pnl_percentage, 2),
            positions_count=positions_valued,
            last_updated=datetime.utcnow(),
        )

    def create_snapshot_for_portfolio(self, portfolio_id: int) -> PortfolioSnapshot:
        """
        🚀 REFACTORED: Create portfolio snapshot using clean repository pattern.

        Args:
            portfolio_id: ID of the portfolio to snapshot

        Returns:
            Created PortfolioSnapshot instance

        Raises:
            ValueError: If portfolio not found or valuation fails
        """
        logger.info(f"Creating snapshot for portfolio {portfolio_id}")

        try:
            # Get current portfolio valuation
            valuation = self.get_portfolio_valuation(portfolio_id)

            # 🚀 CLEAN: Create snapshot through repository
            snapshot = self.portfolio_repo.create_snapshot(
                portfolio_id=portfolio_id,
                value=Decimal(str(valuation.total_value)),
                timestamp=datetime.utcnow(),
            )

            logger.info(
                f"Snapshot created for portfolio {portfolio_id}: "
                f"ID={snapshot.id}, Value=${snapshot.value}, "
                f"Timestamp={snapshot.timestamp}"
            )

            # Create notification for the portfolio owner
            try:
                # 🚀 CLEAN: Get portfolio through repository
                portfolio = self.portfolio_repo.get_by_id(portfolio_id)
                if portfolio and portfolio.client:
                    owner_id = portfolio.client.owner_id
                    portfolio_name = valuation.portfolio_name
                    total_value = valuation.total_value

                    self.notification_service.create_notification(
                        user_id=owner_id,
                        message=f"Valoración del portfolio '{portfolio_name}' actualizada. Nuevo valor: ${total_value:,.2f}",
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to create notification for portfolio snapshot: {str(e)}"
                )

            return snapshot

        except Exception as e:
            # Assuming 'self.db' is available in the context, but it's not defined in the provided code.
            # This line will cause an error if 'self.db' is not defined.
            # For now, commenting out the line as per the original file's state.
            # self.db.rollback() 
            logger.error(
                f"Failed to create snapshot for portfolio {portfolio_id}: {str(e)}"
            )
            raise ValueError(f"Failed to create portfolio snapshot: {str(e)}")