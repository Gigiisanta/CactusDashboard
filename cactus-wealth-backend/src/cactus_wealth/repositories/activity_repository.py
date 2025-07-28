from typing import Optional, List
from sqlmodel import Session, select
from ..models import ClientActivity
from .base_repository import BaseRepository

class ActivityRepository(BaseRepository[ClientActivity]):
    def __init__(self, session: Session):
        super().__init__(session, ClientActivity)

    def get_by_client_id(self, client_id: int, limit: int = 50, offset: int = 0) -> List[ClientActivity]:
        statement = (
            select(ClientActivity)
            .where(ClientActivity.client_id == client_id)
            .order_by(ClientActivity.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all()) 