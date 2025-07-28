from typing import List

from cactus_wealth.database import get_session
from cactus_wealth.models import User, UserRole
from cactus_wealth.schemas import UserCreate, UserRead, UserWithStats, LinkAdvisorRequest, UnlinkAdvisorRequest
from cactus_wealth.security import get_current_user
from cactus_wealth.services.user_advisor_service import UserAdvisorService
from cactus_wealth.repositories.user_repository import UserRepository
from cactus_wealth.repositories.client_repository import ClientRepository
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

router = APIRouter()


def get_user_advisor_service(
    session: Session = Depends(get_session),
) -> UserAdvisorService:
    """Dependency to get user advisor service."""
    user_repo = UserRepository(session)
    client_repo = ClientRepository(session)
    return UserAdvisorService(user_repo, client_repo)


def get_user_repository(session: Session = Depends(get_session)) -> UserRepository:
    """Dependency to get user repository."""
    return UserRepository(session)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_create: UserCreate, 
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserRead:
    """
    Create a new user account.
    """
    try:
        user = user_repo.create_user(user_create=user_create)
        return UserRead.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """
    Get current authenticated user.
    """
    return UserRead.model_validate(current_user)


@router.get("/advisors", response_model=List[UserWithStats])
def get_advisors_with_stats(
    current_user: User = Depends(get_current_user),
    user_advisor_service: UserAdvisorService = Depends(get_user_advisor_service),
) -> List[UserWithStats]:
    """
    Get advisors with their statistics.
    Only accessible by managers.
    """
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can access advisor statistics"
        )
    
    try:
        return user_advisor_service.list_advisors_with_stats(current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get advisors: {str(e)}"
        )


@router.post("/advisors/link", status_code=status.HTTP_200_OK)
def link_advisor(
    request: LinkAdvisorRequest,
    current_user: User = Depends(get_current_user),
    user_advisor_service: UserAdvisorService = Depends(get_user_advisor_service),
) -> dict:
    """
    Link an advisor to the current manager.
    Only accessible by managers.
    """
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can link advisors"
        )
    
    try:
        success = user_advisor_service.link_advisor(current_user.id, request.advisor_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to link advisor"
            )
        return {"message": "Advisor linked successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link advisor: {str(e)}"
        )


@router.post("/advisors/unlink", status_code=status.HTTP_200_OK)
def unlink_advisor(
    request: UnlinkAdvisorRequest,
    current_user: User = Depends(get_current_user),
    user_advisor_service: UserAdvisorService = Depends(get_user_advisor_service),
) -> dict:
    """
    Unlink an advisor from the current manager.
    Only accessible by managers.
    """
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can unlink advisors"
        )
    
    try:
        success = user_advisor_service.unlink_advisor(current_user.id, request.advisor_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to unlink advisor"
            )
        return {"message": "Advisor unlinked successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlink advisor: {str(e)}"
        )


@router.get("/advisors/unassigned", response_model=List[UserRead])
def get_unassigned_advisors(
    current_user: User = Depends(get_current_user),
    user_advisor_service: UserAdvisorService = Depends(get_user_advisor_service),
) -> List[UserRead]:
    """
    Get all unassigned advisors.
    Only accessible by managers.
    """
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can view unassigned advisors"
        )
    
    try:
        advisors = user_advisor_service.get_unassigned_advisors()
        return [UserRead.model_validate(advisor) for advisor in advisors]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get unassigned advisors: {str(e)}"
        )
