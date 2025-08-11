from typing import List

from cactus_wealth.database import get_session
from cactus_wealth.models import User, UserRole
from cactus_wealth.repositories import UserRepository, ClientRepository
from cactus_wealth.schemas import (
    UserCreate,
    UserRead,
    UserWithStats,
    LinkAdvisorRequest,
    UnlinkAdvisorRequest,
    UserUpdate,
    PasswordChangeRequest,
    ManagerChangeRequest,
    ManagerChangeRequestRead,
)
from cactus_wealth.security import get_current_user
from cactus_wealth.services.user_advisor_service import UserAdvisorService
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


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_create: UserCreate, session: Session = Depends(get_session)
) -> UserRead:
    """
    Create a new user account.
    """
    try:
        user_repo = UserRepository(session)
        user = user_repo.create_user(user_create=user_create)
        return UserRead.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Change current user's password after verifying the current one."""
    user_repo = UserRepository(session)
    success = user_repo.change_password(
        user_id=current_user.id,
        current_password=request.current_password,
        new_password=request.new_password,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid current password or user not found")
    return {"message": "Password updated"}


@router.post("/request-manager-change", status_code=status.HTTP_200_OK)
def request_manager_change(
    request: ManagerChangeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """Create a notification for admins to change the advisor's manager."""
    # Verify desired manager exists and is MANAGER/ADMIN/GOD
    user_repo = UserRepository(session)
    desired_manager = user_repo.get(request.desired_manager_id)
    if not desired_manager or desired_manager.role not in [UserRole.MANAGER, UserRole.ADMIN, UserRole.GOD]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid manager selected")

    # Notify all admins and gods
    from cactus_wealth.services import NotificationService
    notif_service = NotificationService(session)

    # Fetch admin/god users
    admin_users = [
        *user_repo.get_by_role(UserRole.ADMIN),
        *user_repo.get_by_role(UserRole.GOD),
    ]
    message = f"{current_user.username} solicita cambiar su manager a {desired_manager.username} (ID {desired_manager.id})."
    for admin in admin_users:
        notif_service.create_notification(admin.id, message)

    return {"message": "Request submitted"}


@router.get("/manager-change/requests", response_model=list[ManagerChangeRequestRead])
def list_manager_change_requests(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.GOD]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    repo = UserRepository(session)
    requests = repo.list_manager_change_requests(status=status_filter)
    return [ManagerChangeRequestRead.model_validate(r) for r in requests]


class ManagerChangeDecision(BaseModel):
    request_id: int
    approve: bool


@router.post("/manager-change/decide")
def decide_manager_change(
    decision: ManagerChangeDecision,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.GOD]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only")
    repo = UserRepository(session)
    success = repo.decide_manager_change_request(
        decision.request_id, decision.approve, current_user.id
    )
    if not success:
        raise HTTPException(status_code=400, detail="Invalid request or already decided")
    return {"message": "Decision saved"}

@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """
    Get current authenticated user.
    """
    return UserRead.model_validate(current_user)


@router.put("/me", response_model=UserRead)
def update_users_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> UserRead:
    """
    Update current authenticated user's profile.
    """
    try:
        user_repo = UserRepository(session)
        updated_user = user_repo.update_profile(
            user_id=current_user.id,
            username=user_update.username
        )
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserRead.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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
