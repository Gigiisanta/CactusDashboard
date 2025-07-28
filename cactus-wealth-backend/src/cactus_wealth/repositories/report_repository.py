from typing import Optional, List
from sqlmodel import Session, select
from ..models import Report
from .base_repository import BaseRepository

class ReportRepository(BaseRepository[Report]):
    def __init__(self, session: Session):
        super().__init__(session, Report)

    def get_by_client_id(self, client_id: int) -> List[Report]:
        statement = select(Report).where(Report.client_id == client_id)
        return list(self.session.exec(statement).all())

    def get_by_advisor_id(self, advisor_id: int) -> List[Report]:
        statement = select(Report).where(Report.advisor_id == advisor_id)
        return list(self.session.exec(statement).all()) 