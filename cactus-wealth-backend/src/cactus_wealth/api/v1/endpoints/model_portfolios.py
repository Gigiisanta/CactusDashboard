from decimal import Decimal

from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.repositories import ModelPortfolioRepository
from cactus_wealth.schemas import (
    ModelPortfolioCreate,
    ModelPortfolioPositionCreate,
    ModelPortfolioPositionRead,
    ModelPortfolioPositionUpdate,
    ModelPortfolioRead,
    ModelPortfolioUpdate,
    ModelPortfolioWeightValidation,
)
from cactus_wealth.security import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

router = APIRouter()


@router.get("/", response_model=list[ModelPortfolioRead])
def get_model_portfolios(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ModelPortfolioRead]:
    """
    Get all model portfolios with their positions.
    """
    portfolio_repo = ModelPortfolioRepository(session)
    portfolios = portfolio_repo.get_model_portfolios(skip=skip, limit=limit)
    return [ModelPortfolioRead.model_validate(portfolio) for portfolio in portfolios]


@router.post(
    "/", response_model=ModelPortfolioRead, status_code=status.HTTP_201_CREATED
)
def create_model_portfolio(
    portfolio_create: ModelPortfolioCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioRead:
    """
    Create a new model portfolio (initially empty of assets).
    """
    try:
        portfolio_repo = ModelPortfolioRepository(session)
        portfolio = portfolio_repo.create_model_portfolio(portfolio_data=portfolio_create)
        return ModelPortfolioRead.model_validate(portfolio)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{portfolio_id}", response_model=ModelPortfolioRead)
def get_model_portfolio(
    portfolio_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioRead:
    """
    Get details of a specific model portfolio, including its positions.
    """
    portfolio_repo = ModelPortfolioRepository(session)
    portfolio = portfolio_repo.get_model_portfolio(portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model portfolio not found"
        )
    return ModelPortfolioRead.model_validate(portfolio)


@router.put("/{portfolio_id}", response_model=ModelPortfolioRead)
def update_model_portfolio(
    portfolio_id: int,
    portfolio_update: ModelPortfolioUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioRead:
    """
    Update a model portfolio's basic information.
    """
    try:
        portfolio_repo = ModelPortfolioRepository(session)
        portfolio = portfolio_repo.update_model_portfolio(
            portfolio_id=portfolio_id,
            portfolio_update=portfolio_update,
        )
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model portfolio not found",
            )
        return ModelPortfolioRead.model_validate(portfolio)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{portfolio_id}", response_model=ModelPortfolioRead)
def delete_model_portfolio(
    portfolio_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioRead:
    """
    Delete a model portfolio and all its positions.
    """
    portfolio_repo = ModelPortfolioRepository(session)
    portfolio = portfolio_repo.delete_model_portfolio(portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model portfolio not found"
        )
    return ModelPortfolioRead.model_validate(portfolio)


@router.post(
    "/{portfolio_id}/positions",
    response_model=ModelPortfolioPositionRead,
    status_code=status.HTTP_201_CREATED,
)
def add_portfolio_position(
    portfolio_id: int,
    position_create: ModelPortfolioPositionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioPositionRead:
    """
    Add a new asset and its weight to a model portfolio.
    """
    try:
        portfolio_repo = ModelPortfolioRepository(session)
        # Check if adding this position would exceed 100% weight
        current_total = portfolio_repo.get_model_portfolio_total_weight(
            portfolio_id=portfolio_id
        )
        new_total = current_total + float(position_create.weight)

        if new_total > 1.0:  # 100%
            raise ValueError(
                f"Adding this position would exceed 100% allocation. Current total: {current_total:.2%}, New total would be: {new_total:.2%}"
            )

        position = portfolio_repo.create_model_portfolio_position(
            position_data=position_create, portfolio_id=portfolio_id
        )
        return ModelPortfolioPositionRead.model_validate(position)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put(
    "/{portfolio_id}/positions/{position_id}", response_model=ModelPortfolioPositionRead
)
def update_portfolio_position(
    portfolio_id: int,
    position_id: int,
    position_update: ModelPortfolioPositionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioPositionRead:
    """
    Update the weight of an asset in a model portfolio.
    """
    try:
        portfolio_repo = ModelPortfolioRepository(session)
        # If weight is being updated, check total allocation
        if position_update.weight is not None:
            current_total = portfolio_repo.get_model_portfolio_total_weight(
                portfolio_id=portfolio_id
            )

            # Get current position to subtract its current weight
            from cactus_wealth.models import ModelPortfolioPosition

            current_position = session.get(ModelPortfolioPosition, position_id)
            if not current_position:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Position not found"
                )

            # Calculate new total: current total - old weight + new weight
            new_total = (
                current_total
                - float(current_position.weight)
                + float(position_update.weight)
            )

            if new_total > 1.0:  # 100%
                raise ValueError(
                    f"Updating this position would exceed 100% allocation. New total would be: {new_total:.2%}"
                )

        position = portfolio_repo.update_model_portfolio_position(
            position_id=position_id, position_update=position_update
        )
        if not position:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Position not found"
            )
        return ModelPortfolioPositionRead.model_validate(position)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{portfolio_id}/positions/{position_id}", response_model=ModelPortfolioPositionRead
)
def delete_portfolio_position(
    portfolio_id: int,
    position_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioPositionRead:
    """
    Remove an asset from a model portfolio.
    """
    portfolio_repo = ModelPortfolioRepository(session)
    position = portfolio_repo.delete_model_portfolio_position(position_id=position_id)
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Position not found"
        )
    return ModelPortfolioPositionRead.model_validate(position)


@router.get(
    "/{portfolio_id}/weight-validation", response_model=ModelPortfolioWeightValidation
)
def validate_portfolio_weights(
    portfolio_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ModelPortfolioWeightValidation:
    """
    Validate the total weight allocation of a model portfolio.
    """
    portfolio_repo = ModelPortfolioRepository(session)
    # Verify portfolio exists
    portfolio = portfolio_repo.get_model_portfolio(portfolio_id=portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Model portfolio not found"
        )

    total_weight = portfolio_repo.get_model_portfolio_total_weight(
        portfolio_id=portfolio_id
    )
    is_valid = total_weight <= 1.0

    if total_weight == 1.0:
        message = "Portfolio allocation is perfectly balanced at 100%"
    elif total_weight < 1.0:
        remaining = 1.0 - total_weight
        message = (
            f"Portfolio allocation is {total_weight:.2%}. Remaining: {remaining:.2%}"
        )
    else:
        excess = total_weight - 1.0
        message = f"Portfolio allocation exceeds 100% by {excess:.2%}. Total: {total_weight:.2%}"

    return ModelPortfolioWeightValidation(
        total_weight=Decimal(str(total_weight)), is_valid=is_valid, message=message
    )
