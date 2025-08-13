
from datetime import UTC
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from cactus_wealth import schemas, services
from cactus_wealth.core.dataprovider import MarketDataProvider, get_market_data_provider
from cactus_wealth.database import get_session
from cactus_wealth.models import (
    Client,
    InvestmentAccount,
    Portfolio,
    PortfolioSnapshot,
    Report,
    User,
    UserRole,
)
from cactus_wealth.repositories.client_repository import ClientRepository
from cactus_wealth.repositories.portfolio_repository import PortfolioRepository
from cactus_wealth.repositories.user_repository import UserRepository
from cactus_wealth.security import get_current_user
from cactus_wealth.services.dashboard_service import (
    DashboardService as NewDashboardService,
)

router = APIRouter()


def get_dashboard_service(
    session: Session = Depends(get_session),
    market_data_provider: MarketDataProvider = Depends(get_market_data_provider),
) -> services.DashboardService:
    """Dependency to get legacy dashboard service."""
    # Construct legacy service according to its actual signature
    return services.DashboardService(session, market_data_provider)


def get_new_dashboard_service(
    session: Session = Depends(get_session),
) -> NewDashboardService:
    """Dependency to get new dashboard service for Manager-Advisor hierarchy."""
    user_repo = UserRepository(session)
    client_repo = ClientRepository(session)
    return NewDashboardService(user_repo, client_repo)


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    _dashboard_service: services.DashboardService = Depends(get_dashboard_service),
    _new_dashboard_service: NewDashboardService = Depends(get_new_dashboard_service),
    session: Session = Depends(get_session),
) -> schemas.DashboardSummaryResponse:
    """
    Get dashboard summary with key performance indicators.

    Returns data tailored to the user's role:
    - ADMIN: all clients and reports
    - MANAGER: own + assigned advisors' clients and reports
    - ADVISOR: own clients and reports
    """
    try:
        # Resolve visible owner IDs based on role
        owner_ids: list[int] | None
        advisor_ids: list[int] = []
        if current_user.role == UserRole.ADMIN:
            owner_ids = None  # All clients
        elif current_user.role == UserRole.MANAGER:
            advisors = UserRepository(session).get_advisors_by_manager(current_user.id)
            advisor_ids = [a.id for a in advisors]
            owner_ids = [current_user.id] + advisor_ids
        else:
            # Treat any advisor variants as ADVISOR scope
            owner_ids = [current_user.id]

        # --- total_clients ---
        stmt_count = select(func.count(Client.id))
        if owner_ids is not None:
            stmt_count = stmt_count.where(Client.owner_id.in_(owner_ids))
        total_clients_res = session.exec(stmt_count).first()
        total_clients = int(total_clients_res[0] if isinstance(total_clients_res, tuple) else (total_clients_res or 0))

        # --- assets_under_management ---
        stmt_aum = (
            select(func.sum(InvestmentAccount.aum))
            .join(Client, InvestmentAccount.client_id == Client.id)
        )
        if owner_ids is not None:
            stmt_aum = stmt_aum.where(Client.owner_id.in_(owner_ids))
        aum_result = session.exec(stmt_aum).first()
        assets_under_management = float(aum_result[0] if isinstance(aum_result, tuple) else (aum_result or 0.0))

        # --- monthly_growth_percentage ---
        from datetime import datetime

        now = datetime.now(UTC)
        month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

        # Determine accessible portfolio IDs
        stmt_portfolios = select(Portfolio.id).join(Client, Portfolio.client_id == Client.id)
        if owner_ids is not None:
            stmt_portfolios = stmt_portfolios.where(Client.owner_id.in_(owner_ids))
        portfolio_ids = [int(r[0] if isinstance(r, tuple) else r) for r in session.exec(stmt_portfolios).all()]

        monthly_growth_percentage: float | None = None
        if portfolio_ids:
            # Per-portfolio boundaries via subqueries (min timestamp in month, max timestamp up to now)
            start_sub = (
                select(
                    PortfolioSnapshot.portfolio_id.label("pid"),
                    func.min(PortfolioSnapshot.timestamp).label("start_ts"),
                )
                .where(
                    PortfolioSnapshot.portfolio_id.in_(portfolio_ids),
                    PortfolioSnapshot.timestamp >= month_start,
                )
                .group_by(PortfolioSnapshot.portfolio_id)
                .subquery()
            )

            end_sub = (
                select(
                    PortfolioSnapshot.portfolio_id.label("pid"),
                    func.max(PortfolioSnapshot.timestamp).label("end_ts"),
                )
                .where(
                    PortfolioSnapshot.portfolio_id.in_(portfolio_ids),
                    PortfolioSnapshot.timestamp <= now,
                )
                .group_by(PortfolioSnapshot.portfolio_id)
                .subquery()
            )

            start_vals = (
                select(
                    PortfolioSnapshot.portfolio_id.label("pid"),
                    PortfolioSnapshot.value.label("start_value"),
                )
                .join(
                    start_sub,
                    (PortfolioSnapshot.portfolio_id == start_sub.c.pid)
                    & (PortfolioSnapshot.timestamp == start_sub.c.start_ts),
                )
            ).subquery()

            end_vals = (
                select(
                    PortfolioSnapshot.portfolio_id.label("pid"),
                    PortfolioSnapshot.value.label("end_value"),
                )
                .join(
                    end_sub,
                    (PortfolioSnapshot.portfolio_id == end_sub.c.pid)
                    & (PortfolioSnapshot.timestamp == end_sub.c.end_ts),
                )
            ).subquery()

            totals_stmt = (
                select(
                    func.sum(start_vals.c.start_value).label("start_total"),
                    func.sum(end_vals.c.end_value).label("end_total"),
                )
                .select_from(start_vals)
                .join(end_vals, end_vals.c.pid == start_vals.c.pid)
            )
            res = session.exec(totals_stmt).first()
            start_total = float(res[0] or 0.0)
            end_total = float(res[1] or 0.0)
            if start_total > 0.0:
                monthly_growth_percentage = (end_total / start_total) - 1.0

        # --- reports_generated_this_quarter ---
        from datetime import timedelta

        quarter_cutoff = now - timedelta(days=90)
        stmt_reports = select(func.count(Report.id)).where(Report.generated_at >= quarter_cutoff)
        advisor_roles = {UserRole.ADVISOR, UserRole.SENIOR_ADVISOR, UserRole.JUNIOR_ADVISOR}
        if current_user.role in advisor_roles:
            stmt_reports = stmt_reports.where(Report.advisor_id == current_user.id)
        elif current_user.role == UserRole.MANAGER:
            allowed_ids = [current_user.id] + advisor_ids
            if allowed_ids:
                stmt_reports = stmt_reports.where(Report.advisor_id.in_(allowed_ids))
            else:
                # No advisors linked; only manager's own reports
                stmt_reports = stmt_reports.where(Report.advisor_id == current_user.id)
        # ADMIN sees all, no advisor filter
        reports_res = session.exec(stmt_reports).first()
        reports_generated_this_quarter = int(
            reports_res[0] if isinstance(reports_res, tuple) else (reports_res or 0)
        )

        return schemas.DashboardSummaryResponse(
            total_clients=total_clients,
            assets_under_management=assets_under_management,
            monthly_growth_percentage=monthly_growth_percentage,
            reports_generated_this_quarter=reports_generated_this_quarter,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate dashboard summary: {str(e)}"
        ) from e


@router.get("/aum-history")
def get_aum_history(
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[schemas.AUMHistoryPoint]:
    """
    Get AUM history data for charts.
    """
    try:
        # Avoid module/package name collision by using repository directly
        start_time = time.perf_counter()
        admin_like_roles = {UserRole.ADMIN, getattr(UserRole, "GOD", UserRole.ADMIN)}
        advisor_id = None if current_user.role in admin_like_roles else current_user.id
        repo = PortfolioRepository(session)
        raw = repo.get_aum_history(days=days, advisor_id=advisor_id)
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        logging.getLogger("uvicorn.access").info(
            "aum_history_query",
            extra={
                "duration_ms": duration_ms,
                "rows": len(raw),
                "days": days,
                "role": str(current_user.role),
                "user_id": current_user.id,
            },
        )
        return [schemas.AUMHistoryPoint(date=item["date"], value=item["value"]) for item in raw]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get AUM history: {str(e)}"
        ) from e
