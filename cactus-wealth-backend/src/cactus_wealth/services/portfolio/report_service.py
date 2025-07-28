from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select

from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import Asset, Client, Portfolio, Position, Report, User, UserRole
from cactus_wealth.services.portfolio.portfolio_service import PortfolioService
from cactus_wealth.services.notification.notification_service import NotificationService
from cactus_wealth.core.logging_config import get_structured_logger
from jinja2 import Environment, FileSystemLoader

logger = get_structured_logger(__name__)


class ReportService:
    """Service class for generating PDF reports."""

    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the report service.

        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.notification_service = NotificationService(db_session)
        self.portfolio_service = PortfolioService(db_session, market_data_provider)

        # Setup Jinja2 template environment with autoescape enabled for security
        current_dir = Path(__file__).parent
        templates_dir = current_dir / "templates"
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=True,  # Enable autoescape to prevent XSS vulnerabilities
        )

    def generate_portfolio_report_pdf(
        self, valuation_data: schemas.PortfolioValuation, portfolio_name: str
    ) -> bytes:
        """
        Generate a PDF report for portfolio valuation.

        Args:
            valuation_data: Portfolio valuation data
            portfolio_name: Name of the portfolio

        Returns:
            PDF content as bytes

        Raises:
            Exception: If template rendering or PDF generation fails
        """
        logger.info(
            f"Generating PDF report for portfolio {valuation_data.portfolio_id}"
        )

        try:
            # Get positions with current market prices for detailed table
            positions_statement = (
                select(Position)
                .join(Asset)
                .where(Position.portfolio_id == valuation_data.portfolio_id)
            )
            positions = self.db.exec(positions_statement).all()

            # Enhance positions with current market prices
            enhanced_positions = []
            for position in positions:
                try:
                    current_price = self.market_data_provider.get_current_price(
                        position.asset.ticker_symbol
                    )

                    # Create enhanced position object with current price
                    enhanced_position = type(
                        "EnhancedPosition",
                        (),
                        {
                            "id": position.id,
                            "quantity": position.quantity,
                            "purchase_price": position.purchase_price,
                            "current_price": current_price,
                            "portfolio_id": position.portfolio_id,
                            "asset_id": position.asset_id,
                            "asset": position.asset,
                            "created_at": position.created_at,
                            "updated_at": position.updated_at,
                        },
                    )()

                    enhanced_positions.append(enhanced_position)

                except Exception as e:
                    logger.warning(
                        f"Failed to get current price for {position.asset.ticker_symbol}: {str(e)}"
                    )
                    # Use purchase price as fallback
                    enhanced_position = type(
                        "EnhancedPosition",
                        (),
                        {
                            "id": position.id,
                            "quantity": position.quantity,
                            "purchase_price": position.purchase_price,
                            "current_price": position.purchase_price,  # Fallback
                            "portfolio_id": position.portfolio_id,
                            "asset_id": position.asset_id,
                            "asset": position.asset,
                            "created_at": position.created_at,
                            "updated_at": position.updated_at,
                        },
                    )()

                    enhanced_positions.append(enhanced_position)

            # Prepare template data
            template_data = {
                "portfolio_id": valuation_data.portfolio_id,
                "portfolio_name": valuation_data.portfolio_name,
                "total_value": valuation_data.total_value,
                "total_cost_basis": valuation_data.total_cost_basis,
                "total_pnl": valuation_data.total_pnl,
                "total_pnl_percentage": valuation_data.total_pnl_percentage,
                "positions_count": valuation_data.positions_count,
                "last_updated": valuation_data.last_updated,
                "report_date": datetime.utcnow(),
                "positions": enhanced_positions,
            }

            # Load and render template
            template = self.env.get_template("report.html")
            html_content = template.render(**template_data)

            # Convert HTML to PDF using WeasyPrint
            try:
                import weasyprint
            except ImportError as e:
                raise Exception(
                    f"WeasyPrint is not available. Please install system dependencies for PDF generation: {str(e)}"
                )

            logger.info("Converting HTML to PDF using WeasyPrint")

            # Get the base URL for CSS resolution
            current_dir = Path(__file__).parent
            templates_dir = current_dir / "templates"
            base_url = f"file://{templates_dir}/"

            # Generate PDF
            pdf_bytes = weasyprint.HTML(
                string=html_content, base_url=base_url
            ).write_pdf()

            logger.info(
                f"PDF report generated successfully for portfolio {valuation_data.portfolio_id}. "
                f"Size: {len(pdf_bytes)} bytes"
            )

            return pdf_bytes

        except Exception as e:
            logger.error(f"Failed to generate PDF report: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")

    async def generate_portfolio_report(
        self, client_id: int, advisor: User, report_type: str = "PORTFOLIO_SUMMARY"
    ) -> schemas.ReportResponse:
        """
        Complete workflow for generating a portfolio report with database tracking.

        Args:
            client_id: ID of the client to generate report for
            advisor: User (advisor) generating the report
            report_type: Type of report to generate

        Returns:
            ReportResponse with success status and report information

        Raises:
            ValueError: If client or portfolio not found or access denied
            Exception: For report generation errors
        """
        logger.info(
            f"Starting report generation for client {client_id} by advisor {advisor.id}"
        )

        try:
            # 1. Verify client exists and advisor has access
            client_statement = select(Client).where(Client.id == client_id)
            if advisor.role != UserRole.ADMIN:
                # Non-admin users can only generate reports for their assigned clients
                client_statement = client_statement.where(Client.owner_id == advisor.id)

            client = self.db.exec(client_statement).first()
            if not client:
                raise ValueError(f"Client {client_id} not found or access denied")

            # 2. Get client's portfolios (we'll use the first one for now)
            portfolio_statement = select(Portfolio).where(
                Portfolio.client_id == client_id
            )
            portfolios = self.db.exec(portfolio_statement).all()

            if not portfolios:
                raise ValueError(f"No portfolios found for client {client_id}")

            # Use the first portfolio for the report
            portfolio = portfolios[0]

            # 3. Get portfolio valuation data
            valuation_data = self.portfolio_service.get_portfolio_valuation(
                portfolio.id
            )

            # 4. Generate PDF
            pdf_bytes = self.generate_portfolio_report_pdf(
                valuation_data, portfolio.name
            )

            # 5. Create media/reports directory if it doesn't exist
            media_dir = Path("media")
            reports_dir = media_dir / "reports"
            reports_dir.mkdir(parents=True, exist_ok=True)

            # 6. Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"report_{client_id}_{timestamp}.pdf"
            file_path = reports_dir / filename

            # 7. Save PDF to file
            with open(file_path, "wb") as f:
                f.write(pdf_bytes)

            logger.info(f"PDF saved to {file_path}")

            # 8. Create Report record in database
            report = Report(
                client_id=client_id,
                advisor_id=advisor.id,
                file_path=str(file_path),
                report_type=report_type,
                generated_at=datetime.utcnow(),
            )

            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)

            logger.info(f"Report record created with ID {report.id}")

            # Create notification for the advisor
            try:
                await self.notification_service.create_notification_async(
                    user_id=advisor.id,
                    message=f"Se ha generado un nuevo reporte para {client.first_name} {client.last_name}",
                )
            except Exception as e:
                logger.warning(
                    f"Failed to create notification for report generation: {str(e)}"
                )

            return schemas.ReportResponse(
                success=True,
                message=f"Report generated successfully for {client.first_name} {client.last_name}",
                report_id=report.id,
                file_path=str(file_path),
            )

        except ValueError as e:
            logger.warning(f"Validation error during report generation: {str(e)}")
            return schemas.ReportResponse(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Unexpected error during report generation: {str(e)}")
            # Rollback transaction if report creation failed
            self.db.rollback()
            return schemas.ReportResponse(
                success=False, message=f"Report generation failed: {str(e)}"
            )