"""
Model portfolio management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import ModelPortfolioRepository

router = APIRouter()


@router.get("/model-portfolios")
async def get_model_portfolios(db: Session = Depends(get_db)):
    """Get all model portfolios."""
    try:
        model_portfolio_repo = ModelPortfolioRepository(db)
        model_portfolios = model_portfolio_repo.get_all()
        return {"model_portfolios": model_portfolios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/model-portfolios/{model_portfolio_id}")
async def get_model_portfolio(model_portfolio_id: int, db: Session = Depends(get_db)):
    """Get a specific model portfolio by ID."""
    try:
        model_portfolio_repo = ModelPortfolioRepository(db)
        model_portfolio = model_portfolio_repo.get_by_id(model_portfolio_id)
        if not model_portfolio:
            raise HTTPException(status_code=404, detail="Model portfolio not found")
        return model_portfolio
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/model-portfolios")
async def create_model_portfolio(model_portfolio_data: dict, db: Session = Depends(get_db)):
    """Create a new model portfolio."""
    try:
        model_portfolio_repo = ModelPortfolioRepository(db)
        model_portfolio = model_portfolio_repo.create(model_portfolio_data)
        return model_portfolio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/model-portfolios/{model_portfolio_id}")
async def update_model_portfolio(model_portfolio_id: int, model_portfolio_data: dict, db: Session = Depends(get_db)):
    """Update a model portfolio."""
    try:
        model_portfolio_repo = ModelPortfolioRepository(db)
        model_portfolio = model_portfolio_repo.update(model_portfolio_id, model_portfolio_data)
        if not model_portfolio:
            raise HTTPException(status_code=404, detail="Model portfolio not found")
        return model_portfolio
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/model-portfolios/{model_portfolio_id}")
async def delete_model_portfolio(model_portfolio_id: int, db: Session = Depends(get_db)):
    """Delete a model portfolio."""
    try:
        model_portfolio_repo = ModelPortfolioRepository(db)
        success = model_portfolio_repo.delete(model_portfolio_id)
        if not success:
            raise HTTPException(status_code=404, detail="Model portfolio not found")
        return {"message": "Model portfolio deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
