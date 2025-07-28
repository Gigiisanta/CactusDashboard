from typing import Annotated

from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider, get_market_data_provider
from cactus_wealth.database import get_session
from cactus_wealth.models import User, UserRole
from cactus_wealth.security import get_current_user
from cactus_wealth import services
from cactus_wealth.services.dashboard_service import DashboardService as NewDashboardService
from cactus_wealth.repositories.user_repository import UserRepository
from cactus_wealth.repositories.client_repository import ClientRepository
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

router = APIRouter()


def get_dashboard_service(
    session: Session = Depends(get_session),
    market_data_provider: MarketDataProvider = Depends(get_market_data_provider),
) -> services.DashboardService:
    """Dependency to get dashboard service."""
    return services.DashboardService(
        db_session=session, market_data_provider=market_data_provider
    )


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
    dashboard_service: services.DashboardService = Depends(get_dashboard_service),
    new_dashboard_service: NewDashboardService = Depends(get_new_dashboard_service),
) -> schemas.DashboardSummaryResponse | schemas.DashboardMetrics:
    """
    Get dashboard summary with key metrics.
    Returns different data based on user role (Manager vs Advisor).
    """
    try:
        # For Manager and Advisor roles, use the new service
        if current_user.role in [UserRole.MANAGER, UserRole.ADVISOR]:
            return new_dashboard_service.get_dashboard_metrics(current_user.id, current_user.role)
        
        # For other roles, use the existing service
        summary = dashboard_service.get_dashboard_summary(current_user)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate dashboard summary: {str(e)}"
        )


@router.get("/aum-history")
def get_aum_history(
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    current_user: User = Depends(get_current_user),
    dashboard_service: services.DashboardService = Depends(get_dashboard_service),
) -> list[schemas.AUMHistoryPoint]:
    """
    Get AUM history data for charts.
    """
    try:
        return dashboard_service.get_aum_history(current_user, days)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get AUM history: {str(e)}"
        )
