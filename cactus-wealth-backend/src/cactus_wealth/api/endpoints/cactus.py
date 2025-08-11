"""
API endpoints for Cactus module.
Handles all HTTP requests for Ideas, Content Matrix, Video Slots, Library, External Links and Secure Credentials.
"""
# ruff: noqa: ARG001

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from ...database import get_session
from ...models import User, UserRole
from ...schemas import (
    CactusContentMatrixCreate,
    CactusContentMatrixRead,
    CactusContentMatrixUpdate,
    CactusExternalLinkCreate,
    CactusExternalLinkRead,
    CactusExternalLinkUpdate,
    CactusIdeaCreate,
    CactusIdeaRead,
    CactusIdeaUpdate,
    CactusLibraryCreate,
    CactusLibraryRead,
    CactusLibraryUpdate,
    CactusSecureCredentialCreate,
    CactusSecureCredentialRead,
    CactusSecureCredentialUpdate,
    CactusSecureCredentialValue,
    CactusVideoSlotCreate,
    CactusVideoSlotRead,
    CactusVideoSlotUpdate,
)
from ...security import get_current_user, require_role
from ...services.cactus_service import CactusService

router = APIRouter(prefix="/cactus", tags=["cactus"])


def get_cactus_service(session: Session = Depends(get_session)) -> CactusService:
    """Dependency to get CactusService instance."""
    return CactusService(session)


# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=dict[str, Any])
async def get_cactus_dashboard(
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get dashboard data for Cactus module."""
    return cactus_service.get_cactus_dashboard_data()


# ==================== IDEAS MANAGER ====================

@router.post("/ideas", response_model=CactusIdeaRead, status_code=status.HTTP_201_CREATED)
async def create_idea(
    idea_data: CactusIdeaCreate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new idea."""
    return cactus_service.create_idea(idea_data, current_user.id)


@router.get("/ideas", response_model=list[CactusIdeaRead])
async def get_all_ideas(
    status_filter: str | None = Query(None, description="Filter by idea status"),
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all ideas, optionally filtered by status."""
    if status_filter:
        return cactus_service.get_ideas_by_status(status_filter)
    return cactus_service.get_all_ideas()


@router.get("/ideas/my", response_model=list[CactusIdeaRead])
async def get_my_ideas(
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get ideas created by the current user."""
    return cactus_service.get_ideas_by_user(current_user.id)


@router.get("/ideas/{idea_id}", response_model=CactusIdeaRead)
async def get_idea_by_id(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get idea by ID."""
    idea = cactus_service.get_idea_by_id(idea_id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea no encontrada"
        )
    return idea


@router.put("/ideas/{idea_id}", response_model=CactusIdeaRead)
async def update_idea(
    idea_id: int,
    idea_data: CactusIdeaUpdate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing idea."""
    idea = cactus_service.update_idea(idea_id, idea_data, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea no encontrada"
        )
    return idea


@router.patch("/ideas/{idea_id}/status", response_model=CactusIdeaRead)
async def move_idea_to_status(
    idea_id: int,
    new_status: str,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Move an idea to a different status (for Kanban board)."""
    idea = cactus_service.move_idea_to_status(idea_id, new_status, current_user.id)
    if not idea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea no encontrada"
        )
    return idea


@router.delete("/ideas/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_idea(
    idea_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete an idea."""
    if not cactus_service.delete_idea(idea_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea no encontrada"
        )


# ==================== CONTENT MATRIX ====================

@router.post("/content-matrix", response_model=CactusContentMatrixRead, status_code=status.HTTP_201_CREATED)
async def create_content_matrix(
    content_data: CactusContentMatrixCreate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new content matrix entry."""
    return cactus_service.create_content_matrix(content_data, current_user.id)


@router.get("/content-matrix", response_model=list[CactusContentMatrixRead])
async def get_all_content_matrix(
    category_filter: str | None = Query(None, description="Filter by content category"),
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all content matrix entries, optionally filtered by category."""
    if category_filter:
        return cactus_service.get_content_matrix_by_category(category_filter)
    return cactus_service.get_all_content_matrix()


@router.get("/content-matrix/{content_id}", response_model=CactusContentMatrixRead)
async def get_content_matrix_by_id(
    content_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get content matrix entry by ID."""
    content = cactus_service.get_content_matrix_by_id(content_id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de matriz de contenido no encontrada"
        )
    return content


@router.put("/content-matrix/{content_id}", response_model=CactusContentMatrixRead)
async def update_content_matrix(
    content_id: int,
    content_data: CactusContentMatrixUpdate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing content matrix entry."""
    content = cactus_service.update_content_matrix(content_id, content_data, current_user.id)
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de matriz de contenido no encontrada"
        )
    return content


@router.delete("/content-matrix/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_matrix(
    content_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete a content matrix entry."""
    if not cactus_service.delete_content_matrix(content_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de matriz de contenido no encontrada"
        )


# ==================== VIDEO SLOTS ====================

@router.post("/video-slots", response_model=CactusVideoSlotRead, status_code=status.HTTP_201_CREATED)
async def create_video_slot(
    video_data: CactusVideoSlotCreate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new video slot."""
    return cactus_service.create_video_slot(video_data, current_user.id)


@router.get("/video-slots", response_model=list[CactusVideoSlotRead])
async def get_all_video_slots(
    platform_filter: str | None = Query(None, description="Filter by platform"),
    start_date: date | None = Query(None, description="Start date filter"),
    end_date: date | None = Query(None, description="End date filter"),
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all video slots with optional filters."""
    if start_date and end_date:
        return cactus_service.get_video_slots_by_date_range(start_date, end_date)
    elif platform_filter:
        return cactus_service.get_video_slots_by_platform(platform_filter)
    return cactus_service.get_all_video_slots()


@router.get("/video-slots/{video_id}", response_model=CactusVideoSlotRead)
async def get_video_slot_by_id(
    video_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get video slot by ID."""
    video = cactus_service.get_video_slot_by_id(video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranura de video no encontrada"
        )
    return video


@router.put("/video-slots/{video_id}", response_model=CactusVideoSlotRead)
async def update_video_slot(
    video_id: int,
    video_data: CactusVideoSlotUpdate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing video slot."""
    video = cactus_service.update_video_slot(video_id, video_data, current_user.id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranura de video no encontrada"
        )
    return video


@router.delete("/video-slots/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video_slot(
    video_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete a video slot."""
    if not cactus_service.delete_video_slot(video_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ranura de video no encontrada"
        )


# ==================== LIBRARY ====================

@router.post("/library", response_model=CactusLibraryRead, status_code=status.HTTP_201_CREATED)
async def create_library_item(
    library_data: CactusLibraryCreate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new library item."""
    return cactus_service.create_library_item(library_data, current_user.id)


@router.get("/library", response_model=list[CactusLibraryRead])
async def get_all_library_items(
    type_filter: str | None = Query(None, description="Filter by library type"),
    search: str | None = Query(None, description="Search in title, author, or description"),
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all library items with optional filters."""
    if search:
        return cactus_service.search_library_items(search)
    elif type_filter:
        return cactus_service.get_library_items_by_type(type_filter)
    return cactus_service.get_all_library_items()


@router.get("/library/{library_id}", response_model=CactusLibraryRead)
async def get_library_item_by_id(
    library_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get library item by ID."""
    library = cactus_service.get_library_item_by_id(library_id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Elemento de biblioteca no encontrado"
        )
    return library


@router.put("/library/{library_id}", response_model=CactusLibraryRead)
async def update_library_item(
    library_id: int,
    library_data: CactusLibraryUpdate,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing library item."""
    library = cactus_service.update_library_item(library_id, library_data, current_user.id)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Elemento de biblioteca no encontrado"
        )
    return library


@router.delete("/library/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_library_item(
    library_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete a library item."""
    if not cactus_service.delete_library_item(library_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Elemento de biblioteca no encontrado"
        )


# ==================== EXTERNAL LINKS ====================

@router.post("/external-links", response_model=CactusExternalLinkRead, status_code=status.HTTP_201_CREATED)
async def create_external_link(
    link_data: CactusExternalLinkCreate,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new external link. Admin only."""
    return cactus_service.create_external_link(link_data, current_user.id)


@router.get("/external-links", response_model=list[CactusExternalLinkRead])
async def get_all_external_links(
    active_only: bool = Query(False, description="Get only active links"),
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all external links."""
    if active_only:
        return cactus_service.get_active_external_links()
    return cactus_service.get_all_external_links()


@router.get("/external-links/{link_id}", response_model=CactusExternalLinkRead)
async def get_external_link_by_id(
    link_id: int,
    current_user: User = Depends(get_current_user),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get external link by ID."""
    link = cactus_service.get_external_link_by_id(link_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enlace externo no encontrado"
        )
    return link


@router.put("/external-links/{link_id}", response_model=CactusExternalLinkRead)
async def update_external_link(
    link_id: int,
    link_data: CactusExternalLinkUpdate,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing external link. Admin only."""
    link = cactus_service.update_external_link(link_id, link_data, current_user.id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enlace externo no encontrado"
        )
    return link


@router.post("/external-links/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_external_links(
    link_positions: list[dict[str, int]],
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Reorder external links. Admin only."""
    if not cactus_service.reorder_external_links(link_positions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al reordenar enlaces"
        )


@router.delete("/external-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_external_link(
    link_id: int,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete an external link. Admin only."""
    if not cactus_service.delete_external_link(link_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enlace externo no encontrado"
        )


# ==================== SECURE CREDENTIALS ====================

@router.post("/secure-credentials", response_model=CactusSecureCredentialRead, status_code=status.HTTP_201_CREATED)
async def create_secure_credential(
    credential_data: CactusSecureCredentialCreate,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Create a new secure credential. Advisor+ only."""
    credential = cactus_service.create_secure_credential(credential_data, current_user.id)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear credencial segura"
        )
    return credential


@router.get("/secure-credentials", response_model=list[CactusSecureCredentialRead])
async def get_all_secure_credentials(
    category_filter: str | None = Query(None, description="Filter by category"),
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get all secure credentials. Advisor+ only."""
    if category_filter:
        return cactus_service.get_secure_credentials_by_category(category_filter)
    return cactus_service.get_all_secure_credentials()


@router.get("/secure-credentials/{credential_id}", response_model=CactusSecureCredentialRead)
async def get_secure_credential_by_id(
    credential_id: int,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get secure credential by ID. Advisor+ only."""
    credential = cactus_service.get_secure_credential_by_id(credential_id)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial segura no encontrada"
        )
    return credential


@router.get("/secure-credentials/{credential_id}/values", response_model=CactusSecureCredentialValue)
async def get_secure_credential_values(
    credential_id: int,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Get secure credential values from AWS Secrets Manager. Advisor+ only."""
    values = cactus_service.get_secure_credential_values(credential_id)
    if not values:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Valores de credencial no encontrados"
        )
    return values


@router.put("/secure-credentials/{credential_id}", response_model=CactusSecureCredentialRead)
async def update_secure_credential(
    credential_id: int,
    credential_data: CactusSecureCredentialUpdate,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Update an existing secure credential. Advisor+ only."""
    credential = cactus_service.update_secure_credential(credential_id, credential_data, current_user.id)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial segura no encontrada"
        )
    return credential


@router.delete("/secure-credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_secure_credential(
    credential_id: int,
    current_user: User = Depends(require_role([UserRole.GOD, UserRole.ADMIN, UserRole.MANAGER, UserRole.ADVISOR, UserRole.SENIOR_ADVISOR])),
    cactus_service: CactusService = Depends(get_cactus_service)
):
    """Delete a secure credential. Advisor+ only."""
    if not cactus_service.delete_secure_credential(credential_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credencial segura no encontrada"
        )
