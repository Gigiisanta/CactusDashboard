"""
Client management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import ClientRepository

router = APIRouter()


@router.get("/clients")
async def get_clients(db: Session = Depends(get_db)):
    """Get all clients."""
    try:
        client_repo = ClientRepository(db)
        clients = client_repo.get_all()
        return {"clients": clients}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/clients/{client_id}")
async def get_client(client_id: int, db: Session = Depends(get_db)):
    """Get a specific client by ID."""
    try:
        client_repo = ClientRepository(db)
        client = client_repo.get_by_id(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/clients")
async def create_client(client_data: dict, db: Session = Depends(get_db)):
    """Create a new client."""
    try:
        client_repo = ClientRepository(db)
        client = client_repo.create(client_data)
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/clients/{client_id}")
async def update_client(client_id: int, client_data: dict, db: Session = Depends(get_db)):
    """Update a client."""
    try:
        client_repo = ClientRepository(db)
        client = client_repo.update(client_id, client_data)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/clients/{client_id}")
async def delete_client(client_id: int, db: Session = Depends(get_db)):
    """Delete a client."""
    try:
        client_repo = ClientRepository(db)
        success = client_repo.delete(client_id)
        if not success:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"message": "Client deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
