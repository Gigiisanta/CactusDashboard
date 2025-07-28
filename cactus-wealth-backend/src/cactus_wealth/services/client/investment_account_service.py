from fastapi import HTTPException, status, UploadFile
from io import BytesIO
from sqlmodel import Session, select

import pandas as pd

from cactus_wealth import schemas
from cactus_wealth.models import Asset, Client, InvestmentAccount, User, UserRole
from cactus_wealth.repositories import ClientRepository
from cactus_wealth.core.logging_config import get_structured_logger

logger = get_structured_logger(__name__)


class InvestmentAccountService:
    """Service class for Investment Account business logic with authorization."""

    def __init__(self, db_session: Session):
        """Initialize the investment account service."""
        self.db = db_session
        self.client_repo = ClientRepository(db_session)

    def create_account_for_client(
        self,
        account_data: schemas.InvestmentAccountCreate,
        client_id: int,
        current_advisor: User,
    ) -> InvestmentAccount:
        """
        Create an investment account for a client with proper authorization.

        Args:
            account_data: Investment account creation data
            client_id: ID of the client
            current_advisor: Current authenticated advisor

        Returns:
            Created InvestmentAccount instance

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        try:
            # Create the investment account
            return self.client_repo.create_client_investment_account(
                account_data=account_data, client_id=client_id
            )
        except Exception as e:
            logger.error(
                f"Failed to create investment account for client {client_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create investment account: {str(e)}",
            )

    def get_account(self, account_id: int, current_advisor: User) -> InvestmentAccount:
        """
        Get an investment account with proper authorization.

        Args:
            account_id: ID of the investment account
            current_advisor: Current authenticated advisor

        Returns:
            InvestmentAccount instance

        Raises:
            HTTPException: If authorization fails or account not found
        """
        # Get the account
        account = self.client_repo.get_investment_account(account_id=account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found",
            )

        # Verify client ownership/access through the account's client
        self._verify_client_access(account.client_id, current_advisor)

        return account

    def get_accounts_by_client(
        self, client_id: int, current_advisor: User, skip: int = 0, limit: int = 100
    ) -> list[InvestmentAccount]:
        """
        Get all investment accounts for a client with proper authorization.

        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of InvestmentAccount instances

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        return self.client_repo.get_investment_accounts_by_client(
            client_id=client_id, skip=skip, limit=limit
        )

    def update_account(
        self,
        account_id: int,
        update_data: schemas.InvestmentAccountUpdate,
        current_advisor: User,
    ) -> InvestmentAccount:
        """
        Update an investment account with proper authorization.

        Args:
            account_id: ID of the investment account
            update_data: Update data
            current_advisor: Current authenticated advisor

        Returns:
            Updated InvestmentAccount instance

        Raises:
            HTTPException: If authorization fails or account not found
        """
        # Get and verify account access
        account = self.get_account(account_id, current_advisor)

        try:
            return self.client_repo.update_investment_account(
                account_db_obj=account, update_data=update_data
            )
        except Exception as e:
            logger.error(f"Failed to update investment account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update investment account: {str(e)}",
            )

    def delete_account(
        self, account_id: int, current_advisor: User
    ) -> InvestmentAccount:
        """
        Delete an investment account with proper authorization.

        Args:
            account_id: ID of the investment account
            current_advisor: Current authenticated advisor

        Returns:
            Deleted InvestmentAccount instance

        Raises:
            HTTPException: If authorization fails or account not found
        """
        # Get and verify account access (this also checks authorization)
        self.get_account(account_id, current_advisor)

        deleted_account = self.client_repo.delete_investment_account(
            account_id=account_id
        )
        if not deleted_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found",
            )

        return deleted_account

    def bulk_upload_investment_accounts(
        self, client_id: int, file: UploadFile, current_advisor: User
    ):
        # Leer archivo Excel o CSV
        content = file.file.read()
        try:
            if file.filename.endswith(".csv"):
                df = pd.read_csv(BytesIO(content))
            else:
                df = pd.read_excel(BytesIO(content))
        except Exception as e:
            return {"error": f"Archivo inválido: {str(e)}"}
        required_cols = {"platform", "account_number", "aum"}
        missing = required_cols - set(df.columns)
        if missing:
            return {"error": f"Faltan columnas requeridas: {', '.join(missing)}"}
        valid_rows = []
        invalid_rows = []
        created = 0
        updated = 0
        for idx, row in df.iterrows():
            if not all(pd.notnull(row[col]) for col in required_cols):
                invalid_rows.append({"row": idx + 2, "data": row.to_dict()})
                continue
            # Buscar si ya existe cuenta con mismo account_number y client_id
            existing = self.db.exec(
                select(InvestmentAccount).where(
                    InvestmentAccount.client_id == client_id,
                    InvestmentAccount.account_number == str(row["account_number"]),
                )
            ).first()
            if existing:
                # Actualizar AUM y plataforma si cambió
                existing.platform = str(row["platform"])
                existing.aum = row["aum"]
                self.db.add(existing)
                updated += 1
            else:
                # Crear nueva cuenta
                data = schemas.InvestmentAccountCreate(
                    platform=str(row["platform"]),
                    account_number=str(row["account_number"]),
                    aum=row["aum"],
                    client_id=client_id,
                )
                obj = InvestmentAccount(**data.model_dump())
                self.db.add(obj)
                created += 1
            valid_rows.append(
                {
                    "platform": row["platform"],
                    "account_number": row["account_number"],
                    "aum": row["aum"],
                }
            )
        self.db.commit()
        return {
            "created": created,
            "updated": updated,
            "invalid": invalid_rows,
            "total": len(df),
        }

    def _verify_client_access(self, client_id: int, current_advisor: User) -> Client:
        """
        Verify that the current advisor has access to the specified client.

        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor

        Returns:
            Client instance if access is granted

        Raises:
            HTTPException: If authorization fails or client not found
        """
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = self.client_repo.get_client(
                client_id=client_id, owner_id=None
            )
            if not client:
                # For ADMIN, we need to check without owner restriction
                client = self.db.get(Client, client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
                )
            return client

        # Non-ADMIN users can only access their own clients
        client = self.client_repo.get_client(
            client_id=client_id, owner_id=current_advisor.id
        )
        if not client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage accounts for your own clients.",
            )

        return client