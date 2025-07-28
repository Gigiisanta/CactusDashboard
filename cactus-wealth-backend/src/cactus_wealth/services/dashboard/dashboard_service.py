import json
from datetime import UTC, datetime

import redis
from sqlmodel import Session, func, select

from cactus_wealth import schemas
from cactus_wealth.core.config import settings
from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import Asset, Client, Portfolio, PortfolioSnapshot, Report, User, UserRole
from cactus_wealth.services.portfolio.portfolio_service import PortfolioService
from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class DashboardService:
    """
    Optimized service for dashboard calculations with Redis caching.

    Features:
    - Redis-based caching with 5-minute TTL for dashboard data
    - Optimized database queries with eager loading
    - Role-based data filtering
    - Efficient AUM calculations
    """

    def __init__(self, db_session: Session, market_data_provider=None):
        """
        Initialize the dashboard service.

        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.portfolio_service = PortfolioService(db_session, market_data_provider)

    def _get_cache_key(self, user_id: int, user_role: str) -> str:
        """Generate cache key for dashboard data."""
        return f"dashboard:summary:{user_id}:{user_role}"

    def _get_cached_dashboard(self, user_id: int, user_role: str) -> dict | None:
        """Get cached dashboard data."""
        if not REDIS_AVAILABLE:
            return None

        try:
            cache_key = self._get_cache_key(user_id, user_role)
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to get cached dashboard: {e}")

        return None

    def _cache_dashboard(self, user_id: int, user_role: str, data: dict) -> None:
        """Cache dashboard data for 5 minutes."""
        if not REDIS_AVAILABLE:
            return

        try:
            cache_key = self._get_cache_key(user_id, user_role)
            redis_client.setex(cache_key, 300, json.dumps(data))  # 5 minutes TTL
        except Exception as e:
            logger.warning(f"Failed to cache dashboard: {e}")

    def get_dashboard_summary(self, user: User) -> schemas.DashboardSummaryResponse:
        """
        Calculate dashboard KPIs with caching and optimized queries.

        Args:
            user: Authenticated user requesting the dashboard data

        Returns:
            DashboardSummaryResponse with calculated KPIs
        """
        logger.info(
            f"Calculating dashboard summary for user {user.id} with role {user.role}"
        )

        # Try to get cached data first
        cached_data = self._get_cached_dashboard(user.id, user.role.value)
        if cached_data:
            logger.info(f"Using cached dashboard data for user {user.id}")
            return schemas.DashboardSummaryResponse(**cached_data)

        # Apply role-based filtering for clients
        clients_query = select(Client)
        if user.role != UserRole.ADMIN:
            # Non-admin users only see their assigned clients
            clients_query = clients_query.where(Client.owner_id == user.id)

        # 1. Total Clients Count - Optimized query
        total_clients = len(self.db.exec(clients_query).all())
        logger.debug(f"Total clients: {total_clients}")

        # 2. Assets Under Management (AUM) - Optimized calculation
        aum = self._calculate_assets_under_management_optimized(user)
        logger.debug(f"Assets under management: ${aum:.2f}")

        # 3. Monthly Growth Percentage - Real implementation
        monthly_growth = self._calculate_monthly_growth(user)
        logger.debug(f"Monthly growth calculation: {monthly_growth}")

        # 4. Reports Generated This Quarter - Optimized query
        reports_generated = self._calculate_reports_generated_this_quarter_optimized(
            user
        )
        logger.debug(f"Reports generated this quarter: {reports_generated}")

        dashboard_summary = schemas.DashboardSummaryResponse(
            total_clients=total_clients,
            assets_under_management=round(aum, 2),
            monthly_growth_percentage=monthly_growth,
            reports_generated_this_quarter=reports_generated,
        )

        # Cache the result
        self._cache_dashboard(user.id, user.role.value, dashboard_summary.model_dump())

        return dashboard_summary

    def _calculate_assets_under_management_optimized(self, user: User) -> float:
        """
        Optimized AUM calculation with efficient queries.
        """
        try:
            # Use a single optimized query for AUM calculation
            if user.role == UserRole.ADMIN:
                # Admin sees all portfolios
                aum_query = select(func.sum(Portfolio.current_value)).select_from(
                    Portfolio
                )
            else:
                # Non-admin users only see their portfolios
                aum_query = (
                    select(func.sum(Portfolio.current_value))
                    .select_from(Portfolio)
                    .join(Client)
                    .where(Client.owner_id == user.id)
                )

            result = self.db.exec(aum_query).first()
            return float(result) if result else 0.0

        except Exception as e:
            logger.error(f"Error calculating AUM: {e}")
            return 0.0

    def _calculate_reports_generated_this_quarter_optimized(self, user: User) -> int:
        """
        Optimized reports count for current quarter.
        """
        try:
            # Calculate quarter boundaries
            now = datetime.utcnow()
            quarter_start = datetime(now.year, ((now.month - 1) // 3) * 3 + 1, 1)

            # Build optimized query
            reports_query = (
                select(func.count(Report.id))
                .select_from(Report)
                .where(Report.generated_at >= quarter_start)
            )

            # Apply role-based filtering
            if user.role != UserRole.ADMIN:
                reports_query = reports_query.where(Report.advisor_id == user.id)

            result = self.db.exec(reports_query).first()
            return int(result) if result else 0

        except Exception as e:
            logger.error(f"Error calculating reports count: {e}")
            return 0

    def _calculate_monthly_growth(self, user: User) -> float | None:
        """
        Calculate monthly growth percentage based on portfolio snapshots.

        Args:
            user: User to calculate growth for

        Returns:
            Monthly growth as decimal (0.082 for 8.2%) or None if insufficient data
        """
        try:
            # Calculate current month start date
            now = datetime.now(UTC)
            current_month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

            # Get portfolios based on user role
            portfolios_query = select(Portfolio).join(Client)
            if user.role != UserRole.ADMIN:
                # Non-admin users only see portfolios of their assigned clients
                portfolios_query = portfolios_query.where(Client.owner_id == user.id)

            portfolios = self.db.exec(portfolios_query).all()

            if not portfolios:
                logger.warning(f"No portfolios found for user {user.id}")
                return None

            portfolio_ids = [p.id for p in portfolios]

            # Get current AUM from most recent snapshots
            current_snapshots_query = (
                select(
                    PortfolioSnapshot.portfolio_id,
                    func.max(PortfolioSnapshot.timestamp).label("latest_timestamp"),
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()

            current_aum_query = select(func.sum(PortfolioSnapshot.value)).join(
                current_snapshots_query,
                (
                    PortfolioSnapshot.portfolio_id
                    == current_snapshots_query.c.portfolio_id
                )
                & (
                    PortfolioSnapshot.timestamp
                    == current_snapshots_query.c.latest_timestamp
                ),
            )

            current_aum = self.db.exec(current_aum_query).first()

            if not current_aum or current_aum == 0:
                logger.warning(f"No current AUM data found for user {user.id}")
                return None

            # Get start-of-month AUM from snapshots closest to month start
            # Find the latest snapshot before or at the start of current month for each portfolio
            month_start_snapshots_query = (
                select(
                    PortfolioSnapshot.portfolio_id,
                    func.max(PortfolioSnapshot.timestamp).label(
                        "month_start_timestamp"
                    ),
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .where(PortfolioSnapshot.timestamp <= current_month_start)
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()

            start_of_month_aum_query = select(func.sum(PortfolioSnapshot.value)).join(
                month_start_snapshots_query,
                (
                    PortfolioSnapshot.portfolio_id
                    == month_start_snapshots_query.c.portfolio_id
                )
                & (
                    PortfolioSnapshot.timestamp
                    == month_start_snapshots_query.c.month_start_timestamp
                ),
            )

            start_of_month_aum = self.db.exec(start_of_month_aum_query).first()

            if not start_of_month_aum or start_of_month_aum == 0:
                logger.warning(f"No start-of-month AUM data found for user {user.id}")
                return None

            # Calculate growth percentage
            # Convert Decimal to float for calculation
            current_aum_float = float(current_aum)
            start_of_month_aum_float = float(start_of_month_aum)

            growth_percentage = (current_aum_float / start_of_month_aum_float) - 1

            logger.info(
                f"Monthly growth calculation for user {user.id}: "
                f"Current=${current_aum_float:.2f}, "
                f"StartOfMonth=${start_of_month_aum_float:.2f}, "
                f"Growth={growth_percentage:.4f} ({growth_percentage * 100:.2f}%)"
            )

            return round(growth_percentage, 4)  # Return as decimal (0.0523 for 5.23%)

        except Exception as e:
            logger.error(
                f"Failed to calculate monthly growth for user {user.id}: {str(e)}"
            )
            # Return None instead of raising exception to prevent dashboard failure
            return None

    def get_aum_history(
        self, user: User, days: int = 30
    ) -> list[schemas.AUMHistoryPoint]:
        """
        🚀 INSIGHT ANALYTICS: Get AUM (Assets Under Management) historical data for charts.

        Returns daily AUM totals based on portfolio snapshots, respecting user permissions.

        Args:
            user: Current authenticated user
            days: Number of days to look back (default: 30)

        Returns:
            List of AUMHistoryPoint objects for time series visualization
        """
        try:
            # Initialize portfolio repository
            from cactus_wealth.repositories.portfolio_repository import PortfolioRepository

            portfolio_repo = PortfolioRepository(self.db)

            # Determine advisor_id based on user role
            advisor_id = None if user.role == UserRole.ADMIN else user.id

            # Get AUM history data
            aum_data = portfolio_repo.get_aum_history(days=days, advisor_id=advisor_id)

            # Convert to schema objects
            aum_history_points = [
                schemas.AUMHistoryPoint(date=item["date"], value=item["value"])
                for item in aum_data
            ]

            logger.info(
                f"AUM history retrieved for user {user.id}: "
                f"{len(aum_history_points)} data points over {days} days"
            )

            return aum_history_points

        except Exception as e:
            logger.error(f"Failed to get AUM history for user {user.id}: {str(e)}")
            # Return empty list instead of raising exception to prevent frontend failure
            return []


# Global Redis client and availability flag for dashboard caching
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False