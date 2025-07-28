from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import (
    ClientActivityCreate,
    ClientActivityRead,
    ClientCreate,
    ClientNoteCreate,
    ClientNoteRead,
    ClientNoteUpdate,
    ClientRead,
    ClientReadWithDetails,
    ClientUpdate,
)
from cactus_wealth.security import get_current_user
from cactus_wealth.services import NotificationService
from cactus_wealth.repositories import ClientRepository, ActivityRepository, NoteRepository
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlmodel import Session

router = APIRouter()


def get_client_repository(session: Session = Depends(get_session)) -> ClientRepository:
    """Dependency to get client repository."""
    return ClientRepository(session)


def get_activity_repository(session: Session = Depends(get_session)) -> ActivityRepository:
    """Dependency to get activity repository."""
    return ActivityRepository(session)


def get_note_repository(session: Session = Depends(get_session)) -> NoteRepository:
    """Dependency to get note repository."""
    return NoteRepository(session)


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    client_create: ClientCreate,
    client_repo: ClientRepository = Depends(get_client_repository),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    """
    Create a new client for the authenticated advisor.
    """
    try:
        client = client_repo.create_client(
            client=client_create, owner_id=current_user.id
        )

        # Create notification for the advisor
        try:
            notification_service = NotificationService(client_repo.session)
            notification_service.create_notification(
                user_id=current_user.id,
                message=f"Nuevo cliente añadido: {client.first_name} {client.last_name}",
            )
        except Exception as e:
            # Don't fail the client creation if notification fails
            print(f"Failed to create notification for new client: {str(e)}")

        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[ClientReadWithDetails])
def read_clients(
    skip: int = 0,
    limit: int = 100,
    client_repo: ClientRepository = Depends(get_client_repository),
    current_user: User = Depends(get_current_user),
) -> list[ClientReadWithDetails]:
    """
    Get all clients belonging to the authenticated advisor with full details.
    GOD users can see all clients regardless of ownership.
    """
    clients = client_repo.get_clients_by_user(
        owner_id=current_user.id, skip=skip, limit=limit, user_role=current_user.role
    )
    return [ClientReadWithDetails.model_validate(client) for client in clients]


@router.get("/{client_id}", response_model=ClientReadWithDetails)
def read_client(
    client_id: int,
    client_repo: ClientRepository = Depends(get_client_repository),
    current_user: User = Depends(get_current_user),
) -> ClientReadWithDetails:
    """
    Get a specific client by ID with full details (only if owned by the authenticated advisor).
    """
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    return ClientReadWithDetails.model_validate(client)


@router.put("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    client_repo: ClientRepository = Depends(get_client_repository),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    """
    Update a client (only if owned by the authenticated advisor).
    """
    try:
        client = client_repo.update_client(
            client_id=client_id,
            client_update=client_update,
            owner_id=current_user.id,
            user_role=current_user.role,
        )
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
            )
        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{client_id}", response_model=ClientRead)
def delete_client(
    client_id: int,
    client_repo: ClientRepository = Depends(get_client_repository),
    current_user: User = Depends(get_current_user),
) -> ClientRead:
    """
    Delete a client (only if owned by the authenticated advisor).
    """
    client = client_repo.remove_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    return ClientRead.model_validate(client)


# ============ CLIENT ACTIVITIES ENDPOINTS ============


@router.get("/{client_id}/activities", response_model=list[ClientActivityRead])
def get_client_activities(
    client_id: int,
    limit: int = 50,
    offset: int = 0,
    client_repo: ClientRepository = Depends(get_client_repository),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    current_user: User = Depends(get_current_user),
) -> list[ClientActivityRead]:
    """
    Get activities for a specific client (only if owned by the authenticated advisor).
    """
    # Verify client ownership
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )

    activities = activity_repo.get_by_client_id(
        client_id=client_id, limit=limit, offset=offset
    )
    return [ClientActivityRead.model_validate(activity) for activity in activities]


@router.post(
    "/{client_id}/activities",
    response_model=ClientActivityRead,
    status_code=status.HTTP_201_CREATED,
)
def create_client_activity(
    client_id: int,
    activity_data: ClientActivityCreate,
    client_repo: ClientRepository = Depends(get_client_repository),
    activity_repo: ActivityRepository = Depends(get_activity_repository),
    current_user: User = Depends(get_current_user),
) -> ClientActivityRead:
    """
    Create a new activity for a specific client (only if owned by the authenticated advisor).
    """
    # Verify client ownership
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )

    # Ensure the activity is for the correct client
    activity_data.client_id = client_id

    activity = activity_repo.create_client_activity(
        activity_data=activity_data, created_by=current_user.id
    )
    return ClientActivityRead.model_validate(activity)


# ============ CLIENT NOTES ENDPOINTS ============


@router.get("/{client_id}/notes", response_model=list[ClientNoteRead])
def get_client_notes(
    client_id: int,
    client_repo: ClientRepository = Depends(get_client_repository),
    note_repo: NoteRepository = Depends(get_note_repository),
    current_user: User = Depends(get_current_user),
) -> list[ClientNoteRead]:
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    notes = note_repo.get_by_client_id(client_id=client_id)
    return [ClientNoteRead.model_validate(note) for note in notes]


@router.post(
    "/{client_id}/notes",
    response_model=ClientNoteRead,
    status_code=status.HTTP_201_CREATED,
)
def create_client_note(
    client_id: int,
    note_data: ClientNoteCreate = Body(...),
    client_repo: ClientRepository = Depends(get_client_repository),
    note_repo: NoteRepository = Depends(get_note_repository),
    current_user: User = Depends(get_current_user),
) -> ClientNoteRead:
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    note_data.client_id = client_id
    note = note_repo.create_client_note(
        note_create=note_data, user_id=current_user.id
    )
    return ClientNoteRead.model_validate(note, from_attributes=True)


@router.put("/{client_id}/notes/{note_id}", response_model=ClientNoteRead)
def update_client_note(
    client_id: int,
    note_id: int,
    note_update: ClientNoteUpdate = Body(...),
    client_repo: ClientRepository = Depends(get_client_repository),
    note_repo: NoteRepository = Depends(get_note_repository),
    current_user: User = Depends(get_current_user),
) -> ClientNoteRead:
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    note = note_repo.get_client_note(note_id=note_id)
    if note is None or note.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    updated_note = note_repo.update_client_note(
        note_id=note_id, note_update=note_update
    )
    return ClientNoteRead.model_validate(updated_note)


@router.delete("/{client_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_note(
    client_id: int,
    note_id: int,
    client_repo: ClientRepository = Depends(get_client_repository),
    note_repo: NoteRepository = Depends(get_note_repository),
    current_user: User = Depends(get_current_user),
):
    client = client_repo.get_client(
        client_id=client_id, owner_id=current_user.id, user_role=current_user.role
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
        )
    note = note_repo.get_client_note(note_id=note_id)
    if note is None or note.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found"
        )
    note_repo.delete_client_note(note_id=note_id)
    return
