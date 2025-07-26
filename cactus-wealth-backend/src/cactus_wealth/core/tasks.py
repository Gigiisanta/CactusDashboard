import structlog
from sqlmodel import Session
from cactus_wealth.database import engine
from cactus_wealth.repositories import ClientRepository
from cactus_wealth.services import PortfolioService
from cactus_wealth.core.dataprovider import MarketDataProvider

logger = structlog.get_logger(__name__)

def get_db_session():
    with Session(engine) as session:
        yield session

async def create_all_snapshots():
    """ARQ job to create portfolio snapshots for all clients."""
    logger.info("Starting create_all_snapshots ARQ job")
    with next(get_db_session()) as db_session:
        client_repo = ClientRepository(db_session)
        portfolio_service = PortfolioService(db_session, MarketDataProvider())

        all_clients = client_repo.get_all()
        logger.info(f"Found {len(all_clients)} clients to process.")

        for client in all_clients:
            logger.info(f"Processing client {client.id}: {client.first_name} {client.last_name}")
            for portfolio in client.portfolios:
                try:
                    portfolio_service.create_snapshot_for_portfolio(portfolio.id)
                    logger.info(f"Snapshot created for portfolio {portfolio.id} of client {client.id}")
                except Exception as e:
                    logger.error(f"Failed to create snapshot for portfolio {portfolio.id} of client {client.id}: {e}")
    logger.info("Finished create_all_snapshots ARQ job")