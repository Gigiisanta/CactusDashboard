"""
Investment account management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import InvestmentAccountRepository

router = APIRouter()


@router.get("/investment-accounts")
async def get_investment_accounts(db: Session = Depends(get_db)):
    """Get all investment accounts."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        investment_accounts = investment_account_repo.get_all()
        return {"investment_accounts": investment_accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/investment-accounts/{account_id}")
async def get_investment_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific investment account by ID."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        investment_account = investment_account_repo.get_by_id(account_id)
        if not investment_account:
            raise HTTPException(status_code=404, detail="Investment account not found")
        return investment_account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/investment-accounts/client/{client_id}")
async def get_client_investment_accounts(client_id: int, db: Session = Depends(get_db)):
    """Get all investment accounts for a specific client."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        investment_accounts = investment_account_repo.get_by_client_id(client_id)
        return {"investment_accounts": investment_accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/investment-accounts")
async def create_investment_account(investment_account_data: dict, db: Session = Depends(get_db)):
    """Create a new investment account."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        investment_account = investment_account_repo.create(investment_account_data)
        return investment_account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/investment-accounts/{account_id}")
async def update_investment_account(account_id: int, investment_account_data: dict, db: Session = Depends(get_db)):
    """Update an investment account."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        investment_account = investment_account_repo.update(account_id, investment_account_data)
        if not investment_account:
            raise HTTPException(status_code=404, detail="Investment account not found")
        return investment_account
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/investment-accounts/{account_id}")
async def delete_investment_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an investment account."""
    try:
        investment_account_repo = InvestmentAccountRepository(db)
        success = investment_account_repo.delete(account_id)
        if not success:
            raise HTTPException(status_code=404, detail="Investment account not found")
        return {"message": "Investment account deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
