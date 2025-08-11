from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from cactus_wealth.database import get_session
from cactus_wealth.models import User

router = APIRouter()

class ManagerResponse(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ManagerResponse])
async def get_managers(db: Session = Depends(get_session)):
    """Obtener lista de managers disponibles para asignación"""
    try:
        managers = db.query(User).filter(
            User.role.in_(["MANAGER", "ADMIN"])
        ).all()
        
        return [
            ManagerResponse(
                id=manager.id,
                name=manager.username,  # Usar username como name
                email=manager.email
            )
            for manager in managers
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener managers: {str(e)}"
        )