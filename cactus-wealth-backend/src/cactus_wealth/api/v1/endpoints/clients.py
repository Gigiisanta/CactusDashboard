"""
Client management endpoints for CRM.
"""

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlmodel import Session

from cactus_wealth import services
from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.repositories import ClientRepository
from cactus_wealth.repositories.note_repository import NoteRepository
from cactus_wealth.schemas import (
    ClientCreate,
    ClientNoteCreate,
    ClientNoteRead,
    ClientNoteUpdate,
    ClientRead,
    ClientReadWithDetails,
    ClientUpdate,
)
from cactus_wealth.security import get_current_user

router = APIRouter()


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    client_create: ClientCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    try:
        client_repo = ClientRepository(session)
        client = client_repo.create_client(client_data=client_create, owner_id=current_user.id)

        # Best effort notification
        try:
            notification_service = services.NotificationService(session)
            notification_service.create_notification(
                user_id=current_user.id,
                message=f"Nuevo cliente añadido: {client.first_name} {client.last_name}",
            )
        except Exception:
            pass

        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[ClientReadWithDetails])
@router.get("", response_model=list[ClientReadWithDetails])
def read_clients(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ClientReadWithDetails]:
    client_repo = ClientRepository(session)
    clients = client_repo.get_clients_by_user(
        owner_id=current_user.id, skip=skip, limit=limit, user_role=current_user.role
    )
    return [ClientReadWithDetails.model_validate(client) for client in clients]


@router.get("/{client_id}", response_model=ClientReadWithDetails)
def read_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientReadWithDetails:
    client_repo = ClientRepository(session)
    client = client_repo.get_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientReadWithDetails.model_validate(client)


@router.put("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    try:
        client_repo = ClientRepository(session)
        client = client_repo.update_client(
            client_id=client_id,
            client_update=client_update,
            owner_id=current_user.id,
            user_role=current_user.role,
        )
        if client is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{client_id}", response_model=ClientRead)
def delete_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    client_repo = ClientRepository(session)
    client = client_repo.delete_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientRead.model_validate(client)


# -------------------- Client Notes --------------------


@router.get("/{client_id}/notes", response_model=list[ClientNoteRead])
def get_client_notes(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[ClientNoteRead]:
    client_repo = ClientRepository(session)
    client = client_repo.get_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    note_repo = NoteRepository(session)
    notes = note_repo.get_by_client_id(client_id=client_id)
    return [ClientNoteRead.model_validate(note) for note in notes]


@router.post("/{client_id}/notes", response_model=ClientNoteRead, status_code=status.HTTP_201_CREATED)
def create_client_note(
    client_id: int,
    note_data: ClientNoteCreate = Body(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientNoteRead:
    client_repo = ClientRepository(session)
    client = client_repo.get_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    note_data.client_id = client_id
    note_repo = NoteRepository(session)
    from cactus_wealth.models import ClientNote as ClientNoteModel

    note = ClientNoteModel(
        client_id=client_id,
        title=note_data.title,
        content=note_data.content,
        created_by=current_user.id,
    )
    created = note_repo.create(note)
    return ClientNoteRead.model_validate(created)


@router.put("/{client_id}/notes/{note_id}", response_model=ClientNoteRead)
def update_client_note(
    client_id: int,
    note_id: int,
    note_update: ClientNoteUpdate = Body(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> ClientNoteRead:
    client_repo = ClientRepository(session)
    client = client_repo.get_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    note_repo = NoteRepository(session)
    note = note_repo.get_by_id(note_id)
    if note is None or note.client_id != client_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if note_update.title is not None:
        note.title = note_update.title
    if note_update.content is not None:
        note.content = note_update.content
    updated_note = note_repo.update(note)
    return ClientNoteRead.model_validate(updated_note)


@router.delete("/{client_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_note(
    client_id: int,
    note_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    client_repo = ClientRepository(session)
    client = client_repo.get_client(client_id=client_id, owner_id=current_user.id, user_role=current_user.role)
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    note_repo = NoteRepository(session)
    note = note_repo.get_by_id(note_id)
    if note is None or note.client_id != client_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    note_repo.delete(note)
    return
