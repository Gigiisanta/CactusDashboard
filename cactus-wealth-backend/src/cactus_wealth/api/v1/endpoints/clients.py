"""
Client management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from cactus_wealth.database import get_db
from cactus_wealth.repositories import ClientRepository
from cactus_wealth.repositories.note_repository import NoteRepository
from cactus_wealth.security import get_current_user
from cactus_wealth.models import User
from cactus_wealth.schemas import ClientNoteCreate, ClientNoteRead, ClientNoteUpdate
from sqlmodel import Session as SQLSession

router = APIRouter()


@router.get("/clients")
async def get_clients(db: Session = Depends(get_db)):
    """Get all clients."""
    try:
        client_repo = ClientRepository(db)
        clients = client_repo.get_all()
        return {"clients": clients}
    except Exception as e:
        print(f"create_client_note_error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


# --- Client Notes CRUD (minimal for tests) ---


@router.post("/{client_id}/notes", response_model=ClientNoteRead, status_code=status.HTTP_201_CREATED)
def create_client_note(
    client_id: int,
    note: ClientNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        repo = NoteRepository(db)
        from cactus_wealth.models import ClientNote as ClientNoteModel

        note_obj = ClientNoteModel(
            client_id=client_id,
            title=note.title,
            content=note.content,
            created_by=current_user.id,
        )
        created = repo.create(note_obj)
        return ClientNoteRead.model_validate(created)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{client_id}/notes", response_model=list[ClientNoteRead])
def list_client_notes(client_id: int, db: Session = Depends(get_db)):
    try:
        repo = NoteRepository(db)
        notes = repo.get_by_client_id(client_id)
        return [ClientNoteRead.model_validate(n) for n in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.put("/{client_id}/notes/{note_id}", response_model=ClientNoteRead)
def update_client_note(client_id: int, note_id: int, update: ClientNoteUpdate, db: Session = Depends(get_db)):
    try:
        repo = NoteRepository(db)
        note = repo.get_by_id(note_id)
        if not note or note.client_id != client_id:
            raise HTTPException(status_code=404, detail="Client note not found")
        if update.title is not None:
            note.title = update.title
        if update.content is not None:
            note.content = update.content
        return ClientNoteRead.model_validate(repo.update(note))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{client_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_note(client_id: int, note_id: int, db: Session = Depends(get_db)):
    try:
        repo = NoteRepository(db)
        note = repo.get_by_id(note_id)
        if not note or note.client_id != client_id:
            raise HTTPException(status_code=404, detail="Client note not found")
        repo.delete(note)
        return None
    except HTTPException:
        raise
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
