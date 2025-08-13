"""Investment account endpoints using service + auth, aligned with tests."""

from fastapi import APIRouter, Depends, UploadFile, status
from sqlmodel import Session

from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import (
    InvestmentAccountCreate,
    InvestmentAccountRead,
    InvestmentAccountUpdate,
)
from cactus_wealth.security import get_current_user
from cactus_wealth.services import InvestmentAccountService
from cactus_wealth.services import (
    InvestmentAccountService as LegacyInvestmentAccountService,
)

router = APIRouter()


def get_account_service(session: Session = Depends(get_session)) -> InvestmentAccountService:
    return InvestmentAccountService(db_session=session)


@router.post(
    "/clients/{client_id}/investment-accounts/",
    response_model=InvestmentAccountRead,
    status_code=status.HTTP_201_CREATED,
)
def create_investment_account_for_client(
    client_id: int,
    account_create: InvestmentAccountCreate,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
) -> InvestmentAccountRead:
    account = account_service.create_account_for_client(
        account_data=account_create, client_id=client_id, current_advisor=current_user
    )
    return InvestmentAccountRead.model_validate(account)


@router.get("/investment-accounts/{account_id}", response_model=InvestmentAccountRead)
def get_investment_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
) -> InvestmentAccountRead:
    account = account_service.get_account(account_id=account_id, current_advisor=current_user)
    return InvestmentAccountRead.model_validate(account)


@router.get(
    "/clients/{client_id}/investment-accounts/", response_model=list[InvestmentAccountRead]
)
def get_investment_accounts_for_client(
    client_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
) -> list[InvestmentAccountRead]:
    accounts = account_service.get_accounts_by_client(
        client_id=client_id, current_advisor=current_user, skip=skip, limit=limit
    )
    return [InvestmentAccountRead.model_validate(a) for a in accounts]


@router.put("/investment-accounts/{account_id}", response_model=InvestmentAccountRead)
def update_investment_account(
    account_id: int,
    account_update: InvestmentAccountUpdate,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
) -> InvestmentAccountRead:
    account = account_service.update_account(
        account_id=account_id, update_data=account_update, current_advisor=current_user
    )
    return InvestmentAccountRead.model_validate(account)


@router.delete("/investment-accounts/{account_id}", response_model=InvestmentAccountRead)
def delete_investment_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
) -> InvestmentAccountRead:
    account = account_service.delete_account(account_id=account_id, current_advisor=current_user)
    return InvestmentAccountRead.model_validate(account)


@router.post("/clients/{client_id}/investment-accounts/bulk-upload/")
def bulk_upload_investment_accounts(
    client_id: int,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    account_service: InvestmentAccountService = Depends(get_account_service),
):
    """Bulk upload investment accounts for a client (CSV/Excel)."""
    # Reuse service implementation already available in consolidated services module
    legacy = LegacyInvestmentAccountService(account_service.db)
    result = legacy.bulk_upload_investment_accounts(client_id, file, current_user)
    # Normalize response shape for tests
    if "invalid" not in result:
        invalid = result.get("invalid_rows") or result.get("errors") or []
        created = int(result.get("created", 0))
        updated = int(result.get("updated", 0))
        return {"created": created, "updated": updated, "invalid": invalid}
    return result
