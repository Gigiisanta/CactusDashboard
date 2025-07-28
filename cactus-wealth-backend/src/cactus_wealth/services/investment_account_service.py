"""Investment Account Service for Cactus Wealth application."""

from typing import List
from sqlmodel import Session, select
from fastapi import HTTPException, status, UploadFile
import logging

from cactus_wealth.models import InvestmentAccount, User
from cactus_wealth.repositories.investment_account_repository import InvestmentAccountRepository
from cactus_wealth.repositories.client_repository import ClientRepository
from cactus_wealth import schemas

logger = logging.getLogger(__name__)


class InvestmentAccountService:
    """Service class for Investment Account business logic with authorization."""

    def __init__(self, db_session: Session):
        """Initialize the investment account service."""
        self.db = db_session
        self.investment_account_repo = InvestmentAccountRepository(db_session)
        self.client_repo = ClientRepository(db_session)

    def _verify_client_access(self, client_id: int, current_advisor: User) -> None:
        """Verify that the current advisor has access to the client."""
        client = self.client_repo.get_client(client_id=client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )

        # Check if advisor has access to this client
        if current_advisor.role == "advisor" and client.advisor_id != current_advisor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You don't have permission to access this client",
            )

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
            return self.investment_account_repo.create_client_investment_account(
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
        account = self.investment_account_repo.get_investment_account(account_id=account_id)
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

        return self.investment_account_repo.get_investment_accounts_by_client(
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
            return self.investment_account_repo.update_investment_account(
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

        deleted_account = self.investment_account_repo.delete_investment_account(
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
        from io import BytesIO
        import pandas as pd

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
                # Actualizar cuenta existente
                existing.platform = row["platform"]
                existing.aum = float(row["aum"])
                self.db.add(existing)
                updated += 1
            else:
                # Crear nueva cuenta
                new_account = InvestmentAccount(
                    client_id=client_id,
                    platform=row["platform"],
                    account_number=str(row["account_number"]),
                    aum=float(row["aum"])
                )
                self.db.add(new_account)
                created += 1
            
            valid_rows.append({"row": idx + 2, "data": row.to_dict()})
        
        try:
            self.db.commit()
            return {
                "success": True,
                "created": created,
                "updated": updated,
                "valid_rows": len(valid_rows),
                "invalid_rows": len(invalid_rows),
                "errors": invalid_rows
            }
        except Exception as e:
            self.db.rollback()
            return {"error": f"Error al guardar en base de datos: {str(e)}"}