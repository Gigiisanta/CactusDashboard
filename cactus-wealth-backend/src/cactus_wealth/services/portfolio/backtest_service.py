import asyncio
import hashlib
import json
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
import redis
import yfinance as yf

from cactus_wealth import schemas
from cactus_wealth.models import Asset
from cactus_wealth.core.config import settings
from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class PortfolioBacktestService:
    """
    Optimized service for portfolio backtesting with Redis caching and concurrency.

    Features:
    - Industry-standard financial formulas
    - Redis-based caching with 24h TTL
    - Concurrent yfinance API calls
    - 100% data integrity from yfinance
    """

    def __init__(self):
        """Initialize the optimized backtest service with Redis connection."""
        self.period_mapping = {
            "1d": "1d",
            "5d": "5d",
            "1mo": "1mo",
            "3mo": "3mo",
            "6mo": "6mo",
            "1y": "1y",
            "2y": "2y",
            "5y": "5y",
            "10y": "10y",
            "ytd": "ytd",
            "max": "max",
        }

        # Initialize Redis connection
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            self.redis_client.ping()  # Test connection
            logger.info("Redis connection established for backtesting cache")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Operating without cache.")
            self.redis_client = None

    def _ensure_timezone_aware(
        self, target_date: datetime, reference_index: pd.DatetimeIndex
    ) -> datetime:
        """
        Ensure target_date is timezone-aware and compatible with reference_index.

        This utility function resolves timezone compatibility issues when comparing
        datetime objects with pandas DatetimeIndex objects from yfinance, which
        are typically timezone-aware.

        Args:
            target_date: The datetime object to make timezone-aware
            reference_index: The pandas DatetimeIndex to get timezone info from

        Returns:
            A timezone-aware datetime object compatible with reference_index

        Raises:
            None - handles all cases gracefully
        """
        # If target_date is already timezone-aware, return as-is
        if target_date.tzinfo is not None:
            return target_date

        # If reference_index has timezone info, apply it to target_date
        if hasattr(reference_index, "tz") and reference_index.tz is not None:
            return target_date.replace(tzinfo=reference_index.tz)

        # If reference_index has no timezone, return target_date unchanged
        return target_date

    async def perform_backtest(self, request: schemas.BacktestRequest) -> schemas.BacktestResponse:
        """
        Perform optimized portfolio backtesting with caching and concurrency.

        Args:
            request: BacktestRequest with composition, benchmarks, and period

        Returns:
            BacktestResponse with historical performance data

        Raises:
            ValueError: For invalid periods or data retrieval failures
        """
        try:
            # Validate period
            if request.period not in self.period_mapping:
                raise ValueError(
                    f"Invalid period: {request.period}. Valid options: {list(self.period_mapping.keys())}"
                )

            # Extract and validate tickers
            portfolio_tickers = [comp.ticker for comp in request.composition]
            all_tickers = portfolio_tickers + request.benchmarks

            if not all_tickers:
                raise ValueError("No tickers provided for backtesting")

            # Validate weights sum to 1.0
            total_weight = sum(comp.weight for comp in request.composition)
            if abs(total_weight - 1.0) > 0.001:
                raise ValueError(
                    f"Portfolio weights must sum to 1.0, got {total_weight}"
                )

            # Download historical data (with caching and concurrency)
            hist_data = await self._download_historical_data_cached(
                all_tickers, request.period
            )

            if hist_data.empty:
                raise ValueError(
                    "No historical data available for the selected tickers and period"
                )

            # Download dividend data concurrently
            dividend_data = await self._download_dividend_data_concurrent(
                all_tickers, request.period
            )

            # Calculate portfolio performance using daily returns
            portfolio_daily_returns = self._calculate_portfolio_daily_returns(
                hist_data, request.composition, portfolio_tickers
            )

            # Calculate portfolio cumulative returns for visualization
            portfolio_cumulative = self._calculate_cumulative_returns(
                portfolio_daily_returns
            )

            # Calculate benchmark returns
            benchmark_returns = self._calculate_benchmark_returns(
                hist_data, request.benchmarks
            )

            # Generate data points for visualization
            data_points = self._generate_data_points(
                hist_data.index, portfolio_cumulative, benchmark_returns, dividend_data
            )

            # Calculate performance metrics using corrected formulas
            performance_metrics = self._calculate_performance_metrics_corrected(
                portfolio_daily_returns, benchmark_returns
            )

            return schemas.BacktestResponse(
                start_date=hist_data.index[0].strftime("%Y-%m-%d"),
                end_date=hist_data.index[-1].strftime("%Y-%m-%d"),
                portfolio_composition=request.composition,
                benchmarks=request.benchmarks,
                data_points=data_points,
                performance_metrics=performance_metrics,
            )

        except Exception as e:
            logger.error(f"Backtesting error: {str(e)}")
            raise ValueError(f"Failed to perform backtest: {str(e)}")

    def _generate_cache_key(
        self, ticker: str, period: str, data_type: str = "prices"
    ) -> str:
        """Generate unique cache key for ticker data."""
        key_string = f"{data_type}:{ticker}:{period}"
        # Use SHA-256 instead of MD5 for better security (not used for cryptographic purposes)
        return f"yfinance:{hashlib.sha256(key_string.encode()).hexdigest()}"

    async def _download_historical_data_cached(
        self, tickers: list[str], period: str
    ) -> pd.DataFrame:
        """Download historical data with Redis caching and concurrent execution."""

        async def fetch_ticker_data(ticker: str) -> tuple[str, pd.Series]:
            """Fetch data for a single ticker with caching."""
            cache_key = self._generate_cache_key(ticker, period, "prices")

            # Try cache first
            if self.redis_client:
                try:
                    cached_data = self.redis_client.get(cache_key)
                    if cached_data:
                        data_dict = json.loads(cached_data)
                        return ticker, pd.Series(
                            data_dict["prices"],
                            index=pd.to_datetime(data_dict["dates"]),
                        )
                except Exception as e:
                    logger.warning(f"Cache read error for {ticker}: {e}")

            # Cache miss - fetch from yfinance
            try:
                data = yf.download(
                    ticker, period=period, interval="1d", auto_adjust=True, prepost=True
                )
                if data.empty:
                    raise ValueError(f"No data available for {ticker}")

                close_prices = data["Close"]

                # Ensure close_prices is a Series (in case yfinance returns DataFrame)
                if isinstance(close_prices, pd.DataFrame):
                    close_prices = (
                        close_prices.squeeze()
                    )  # Convert single-column DataFrame to Series

                # Cache the result with robust serialization
                if self.redis_client and not close_prices.empty:
                    try:
                        cache_data = {
                            "prices": close_prices.values.tolist(),  # Use .values.tolist() for safe serialization
                            "dates": close_prices.index.strftime("%Y-%m-%d").tolist(),
                        }
                        self.redis_client.setex(
                            cache_key, 86400, json.dumps(cache_data)
                        )  # 24h TTL
                    except Exception as e:
                        logger.warning(f"Cache write error for {ticker}: {e}")

                return ticker, close_prices

            except Exception as e:
                logger.error(f"Failed to download data for {ticker}: {e}")
                raise ValueError(f"Failed to retrieve data for {ticker}: {str(e)}")

        # Execute all downloads concurrently
        tasks = [fetch_ticker_data(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks)

        # Combine results into DataFrame with proper DatetimeIndex
        data_dict = dict(results)
        combined_df = pd.DataFrame(data_dict)

        # Ensure DataFrame has a proper DatetimeIndex for backtesting
        if not isinstance(combined_df.index, pd.DatetimeIndex):
            # Try to convert index to datetime if it's not already
            try:
                combined_df.index = pd.to_datetime(combined_df.index)
            except Exception as e:
                logger.error(f"Failed to convert index to DatetimeIndex: {e}")
                raise ValueError("Invalid date index in historical data")

        # Sort by date to ensure chronological order
        combined_df = combined_df.sort_index()

        return combined_df.dropna()

    async def _download_dividend_data_concurrent(
        self, tickers: list[str], period: str
    ) -> dict[str, pd.Series]:
        """Download dividend data concurrently with caching."""

        async def fetch_dividend_data(ticker: str) -> tuple[str, pd.Series]:
            """Fetch dividend data for single ticker."""
            cache_key = self._generate_cache_key(ticker, period, "dividends")

            # Try cache first
            if self.redis_client:
                try:
                    cached_data = self.redis_client.get(cache_key)
                    if cached_data:
                        data_dict = json.loads(cached_data)
                        if data_dict["dividends"]:
                            return ticker, pd.Series(
                                data_dict["dividends"],
                                index=pd.to_datetime(data_dict["dates"]),
                            )
                        else:
                            return ticker, pd.Series(dtype=float)
                except Exception as e:
                    logger.warning(f"Dividend cache read error for {ticker}: {e}")

            # Fetch from yfinance
            try:
                ticker_obj = yf.Ticker(ticker)
                dividends = ticker_obj.dividends

                # Filter by period
                if not dividends.empty:
                    end_date = datetime.now()
                    period_days = {
                        "1mo": 30,
                        "3mo": 90,
                        "6mo": 180,
                        "1y": 365,
                        "2y": 730,
                        "5y": 1825,
                    }
                    if period in period_days:
                        start_date = end_date - timedelta(days=period_days[period])
                        # Ensure timezone compatibility before comparison
                        compatible_start_date = self._ensure_timezone_aware(
                            start_date, dividends.index
                        )
                        dividends = dividends[dividends.index >= compatible_start_date]

                # Cache result
                if self.redis_client:
                    try:
                        if not dividends.empty:
                            cache_data = {
                                "dividends": dividends.tolist(),
                                "dates": dividends.index.strftime("%Y-%m-%d").tolist(),
                            }
                        else:
                            cache_data = {"dividends": [], "dates": []}
                        self.redis_client.setex(
                            cache_key, 86400, json.dumps(cache_data)
                        )
                    except Exception as e:
                        logger.warning(f"Dividend cache write error for {ticker}: {e}")

                return ticker, dividends

            except Exception as e:
                logger.warning(f"Could not download dividends for {ticker}: {e}")
                return ticker, pd.Series(dtype=float)

        # Execute dividend downloads concurrently
        tasks = [fetch_dividend_data(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks)

        return dict(results)

    def _calculate_portfolio_daily_returns(
        self,
        hist_data: pd.DataFrame,
        composition: list[schemas.PortfolioComposition],
        tickers: list[str],
    ) -> pd.Series:
        """Calculate portfolio daily returns (not cumulative) for accurate metrics."""

        # Robust validation of DataFrame structure for backtesting
        if hist_data.empty:
            raise ValueError("Historical data is empty")

        # Ensure DataFrame has proper DatetimeIndex
        if not isinstance(hist_data.index, pd.DatetimeIndex):
            raise ValueError(
                "Historical data must have DatetimeIndex for backtesting calculations"
            )

        # Ensure chronological order
        if not hist_data.index.is_monotonic_increasing:
            hist_data = hist_data.sort_index()
            logger.info("Historical data sorted chronologically for backtesting")

        # Create weights dictionary
        weights = {comp.ticker: comp.weight for comp in composition}

        # Validate all tickers present
        missing_tickers = [t for t in tickers if t not in hist_data.columns]
        if missing_tickers:
            raise ValueError(f"Missing price data for tickers: {missing_tickers}")

        # Calculate daily returns for each asset
        asset_returns = hist_data[tickers].pct_change().fillna(0)

        # Calculate weighted portfolio daily returns
        portfolio_daily_returns = pd.Series(0.0, index=asset_returns.index)
        for ticker in tickers:
            if ticker in weights:
                portfolio_daily_returns += asset_returns[ticker] * weights[ticker]

        return portfolio_daily_returns.dropna()

    def _calculate_cumulative_returns(
        self, daily_returns: pd.Series, start_value: float = 100.0
    ) -> pd.Series:
        """Convert daily returns to cumulative returns for visualization."""
        return (1 + daily_returns).cumprod() * start_value

    def _calculate_benchmark_returns(
        self, hist_data: pd.DataFrame, benchmarks: list[str]
    ) -> dict[str, pd.Series]:
        """Calculate benchmark cumulative returns."""
        benchmark_returns = {}

        for benchmark in benchmarks:
            if benchmark in hist_data.columns:
                daily_returns = hist_data[benchmark].pct_change().fillna(0)
                cumulative_returns = self._calculate_cumulative_returns(daily_returns)
                benchmark_returns[benchmark] = cumulative_returns

        return benchmark_returns

    def _calculate_performance_metrics_corrected(
        self, daily_returns: pd.Series, benchmark_returns: dict[str, pd.Series]
    ) -> dict:
        """
        Calculate performance metrics using industry-standard formulas.

        All formulas follow CFA Institute standards:
        - Annualized Volatility: σ_annual = σ_daily × √252
        - Sharpe Ratio: (R_p - R_f) / σ_p (annualized)
        - Max Drawdown: Maximum peak-to-trough decline
        """
        if len(daily_returns) < 2:
            raise ValueError("Insufficient data points for performance calculation")

        # Total Return
        total_return = (1 + daily_returns).prod() - 1

        # Annualized Return
        trading_days = len(daily_returns)
        years = trading_days / 252.0
        annualized_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0

        # Annualized Volatility (Industry Standard)
        daily_volatility = daily_returns.std()
        annualized_volatility = daily_volatility * np.sqrt(252)

        # Sharpe Ratio (Corrected - using daily returns)
        # Using 2% risk-free rate (clearly documented assumption)
        risk_free_rate_annual = 0.02
        risk_free_rate_daily = risk_free_rate_annual / 252
        excess_returns = daily_returns - risk_free_rate_daily
        sharpe_ratio = (
            (excess_returns.mean() * 252) / annualized_volatility
            if annualized_volatility > 0
            else 0
        )

        # Maximum Drawdown (Corrected Algorithm)
        cumulative_returns = self._calculate_cumulative_returns(daily_returns, 1.0)
        running_max = cumulative_returns.expanding().max()
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdowns.min()  # Most negative value

        # Start and end values for visualization
        start_value = 100.0
        end_value = start_value * (1 + total_return)

        metrics = {
            "total_return": float(total_return),
            "annualized_return": float(annualized_return),
            "annualized_volatility": float(annualized_volatility),
            "sharpe_ratio": float(sharpe_ratio),
            "max_drawdown": float(max_drawdown),
            "start_value": float(start_value),
            "end_value": float(end_value),
            "trading_days": int(trading_days),
            "risk_free_rate_assumption": 0.02,
        }

        # Add benchmark comparisons using same methodology
        for benchmark_name, benchmark_series in benchmark_returns.items():
            if not benchmark_series.empty and len(benchmark_series) > 1:
                bench_daily_returns = benchmark_series.pct_change().dropna()
                if len(bench_daily_returns) > 0:
                    bench_total_return = (1 + bench_daily_returns).prod() - 1
                    metrics[f"{benchmark_name}_total_return"] = float(
                        bench_total_return
                    )
                    metrics[f"vs_{benchmark_name}"] = float(
                        total_return - bench_total_return
                    )
                    metrics[f"alpha_vs_{benchmark_name}"] = float(
                        annualized_return
                        - ((1 + bench_total_return) ** (1 / years) - 1)
                    )

        return metrics

    def _generate_data_points(
        self,
        dates: pd.DatetimeIndex,
        portfolio_cumulative: pd.Series,
        benchmark_returns: dict[str, pd.Series],
        dividend_data: dict[str, pd.Series],
    ) -> list[schemas.BacktestDataPoint]:
        """Generate data points for visualization."""
        data_points = []

        for date in dates:
            # Portfolio value
            portfolio_value = float(portfolio_cumulative.loc[date])

            # Benchmark values
            benchmark_values = {}
            for benchmark, returns in benchmark_returns.items():
                if date in returns.index:
                    benchmark_values[benchmark] = float(returns.loc[date])

            # Dividend events for this date
            dividend_events = []
            for ticker, dividends in dividend_data.items():
                if not dividends.empty and date.date() in [
                    d.date() for d in dividends.index
                ]:
                    # Use timezone-aware date comparison by converting both to date objects
                    matching_dividends = dividends[dividends.index.date == date.date()]
                    if not matching_dividends.empty:
                        dividend_amount = matching_dividends.iloc[0]
                        dividend_events.append(
                            {"ticker": ticker, "amount": float(dividend_amount)}
                        )

            data_points.append(
                schemas.BacktestDataPoint(
                    date=date.strftime("%Y-%m-%d"),
                    portfolio_value=portfolio_value,
                    benchmark_values=benchmark_values,
                    dividend_events=dividend_events,
                )
            )

        return data_points