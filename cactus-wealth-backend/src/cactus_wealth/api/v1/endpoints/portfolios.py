"""
Portfolio management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import PortfolioRepository

router = APIRouter()


@router.get("/portfolios")
async def get_portfolios(db: Session = Depends(get_db)):
    """Get all portfolios."""
    try:
        portfolio_repo = PortfolioRepository(db)
        portfolios = portfolio_repo.get_all()
        return {"portfolios": portfolios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/portfolios/{portfolio_id}")
async def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """Get a specific portfolio by ID."""
    try:
        portfolio_repo = PortfolioRepository(db)
        portfolio = portfolio_repo.get_by_id(portfolio_id)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        return portfolio
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/portfolios/client/{client_id}")
async def get_client_portfolios(client_id: int, db: Session = Depends(get_db)):
    """Get all portfolios for a specific client."""
    try:
        portfolio_repo = PortfolioRepository(db)
        portfolios = portfolio_repo.get_by_client_id(client_id)
        return {"portfolios": portfolios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/portfolios")
async def create_portfolio(portfolio_data: dict, db: Session = Depends(get_db)):
    """Create a new portfolio."""
    try:
        portfolio_repo = PortfolioRepository(db)
        portfolio = portfolio_repo.create(portfolio_data)
        return portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/portfolios/{portfolio_id}")
async def update_portfolio(portfolio_id: int, portfolio_data: dict, db: Session = Depends(get_db)):
    """Update a portfolio."""
    try:
        portfolio_repo = PortfolioRepository(db)
        portfolio = portfolio_repo.update(portfolio_id, portfolio_data)
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        return portfolio
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/portfolios/{portfolio_id}")
async def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """Delete a portfolio."""
    try:
        portfolio_repo = PortfolioRepository(db)
        success = portfolio_repo.delete(portfolio_id)
        if not success:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        return {"message": "Portfolio deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
