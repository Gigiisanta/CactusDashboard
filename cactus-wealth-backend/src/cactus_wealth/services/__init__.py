"""Services package for Cactus Wealth application."""

from .dashboard_service import DashboardService
from .insurance_policy_service import InsurancePolicyService
from .investment_account_service import InvestmentAccountService
from .user_advisor_service import UserAdvisorService
from .webauthn_service import WebAuthnService

# Backwards-compat: test suites import these names from services
from .report_service import ReportService  # type: ignore
from .portfolio_backtest_service import PortfolioBacktestService  # type: ignore

__all__ = [
    "DashboardService",
    "UserAdvisorService",
    "WebAuthnService",
    "InsurancePolicyService",
    "InvestmentAccountService",
    "ReportService",
    "PortfolioBacktestService",
]
