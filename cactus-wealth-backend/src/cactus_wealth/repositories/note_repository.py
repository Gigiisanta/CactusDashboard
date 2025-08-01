from typing import Optional, List
from sqlmodel import Session, select
from ..models import ClientNote
from .base_repository import BaseRepository

class NoteRepository(BaseRepository[ClientNote]):
    def __init__(self, session: Session):
        super().__init__(session, ClientNote)

    def get_by_client_id(self, client_id: int) -> List[ClientNote]:
        statement = select(ClientNote).where(ClientNote.client_id == client_id)
        return list(self.session.exec(statement).all()) 