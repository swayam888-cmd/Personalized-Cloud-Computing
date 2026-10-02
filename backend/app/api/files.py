"""
Files API Routes
================
Endpoints for file and folder management — the core of cloud storage.

All routes are PROTECTED — they require a valid JWT token.
All operations are scoped to the authenticated user's files only.

ENDPOINTS:
    GET    /api/files/              → List files (optionally in a folder)
    GET    /api/files/stats         → Get storage usage stats
    POST   /api/files/upload        → Upload a file
    POST   /api/files/folder        → Create a folder
    GET    /api/files/{id}          → Get file/folder metadata
    GET    /api/files/{id}/download → Download a file
    GET    /api/files/{id}/breadcrumbs → Get breadcrumb trail
    PUT    /api/files/{id}/rename   → Rename a file/folder
    PUT    /api/files/{id}/move     → Move a file/folder
    DELETE /api/files/{id}          → Delete a file/folder

UPLOAD NOTE:
    File uploads use multipart/form-data (not JSON).
    The 'parent_id' is sent as a form field alongside the file.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status, Query
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.file import (
    FileResponse,
    FolderCreate,
    FileRename,
    FileMove,
    StorageStats,
    StorageAnalytics,
)
from app.services import storage as storage_service
from app.services import activity as activity_service

router = APIRouter(prefix="/files", tags=["Files"])


# ═══════════════════════════════════════════════════════════
# List & Stats
# ═══════════════════════════════════════════════════════════

@router.get("/", response_model=list[FileResponse])
def list_files(
    parent_id: int | None = Query(
        default=None,
        description="Folder ID to list contents of (null = root)",
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List files and folders in a directory.

    GET /api/files/            → root level
    GET /api/files/?parent_id=5 → inside folder 5
    """
    # If parent_id is provided, verify it exists and is a folder
    if parent_id is not None:
        parent = storage_service.get_file(db, user.id, parent_id)
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found",
            )
        if not parent.is_folder:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not a folder",
            )

    return storage_service.list_folder_contents(db, user.id, parent_id)


@router.get("/stats", response_model=StorageStats)
def get_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get storage usage statistics for the current user.

    Returns used space, quota, file count, and folder count.
    """
    return storage_service.get_storage_stats(db, user)


@router.get("/analytics", response_model=StorageAnalytics)
def get_analytics(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive storage analytics for the current user.

    Returns used space, quota, remaining quota, percentage, counts,
    and category breakdown (documents, images, media, other).
    """
    return storage_service.get_storage_analytics(db, user)


@router.get("/recent", response_model=list[FileResponse])
def get_recent(
    limit: int = Query(default=5, ge=1, le=20, description="Number of recent files to return"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the most recently uploaded or modified files for the current user.

    Returns up to `limit` files (default 5) sorted newest first.
    Excludes folders and physical storage paths.
    """
    return storage_service.get_recent_files(db, user.id, limit=limit)


# ═══════════════════════════════════════════════════════════
# Upload & Create
# ═══════════════════════════════════════════════════════════

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    parent_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a file.

    This endpoint accepts multipart/form-data:
    - 'file': the file to upload
    - 'parent_id': (optional) folder to upload into

    Example with curl:
        curl -X POST http://localhost:8000/api/files/upload \\
             -H "Authorization: Bearer <token>" \\
             -F "file=@photo.jpg" \\
             -F "parent_id=5"
    """
    try:
        db_file = await storage_service.save_uploaded_file(
            db, user, file, parent_id
        )
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="UPLOAD",
            item_name=db_file.name,
            details=f"Uploaded '{db_file.name}' ({activity_service.format_file_size(db_file.size_bytes)})",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return db_file


@router.post("/folder", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_data: FolderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new folder.

    POST /api/files/folder
    Body: { "name": "My Documents", "parent_id": null }
    """
    try:
        folder = storage_service.create_folder(
            db, user, folder_data.name, folder_data.parent_id
        )
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="CREATE_FOLDER",
            item_name=folder.name,
            details=f"Created folder '{folder.name}'",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return folder


# ═══════════════════════════════════════════════════════════
# Single File Operations
# ═══════════════════════════════════════════════════════════

@router.get("/{file_id}", response_model=FileResponse)
def get_file_metadata(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get metadata for a specific file or folder."""
    file = storage_service.get_file(db, user.id, file_id)
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    return file


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a file.

    Returns the file content with appropriate Content-Type and
    Content-Disposition headers so the browser downloads it.
    """
    file = storage_service.get_file(db, user.id, file_id)
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    if file.is_folder:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot download a folder",
        )

    file_path = storage_service.get_file_path(db, user.id, file_id)
    if file_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File content not found on disk",
        )

    activity_service.log_activity(
        db=db,
        user_id=user.id,
        action="DOWNLOAD",
        item_name=file.name,
        details=f"Downloaded '{file.name}'",
    )

    return FastAPIFileResponse(
        path=str(file_path),
        filename=file.name,
        media_type=file.mime_type or "application/octet-stream",
    )


@router.get("/{file_id}/breadcrumbs")
def get_breadcrumbs(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the breadcrumb trail for a folder.

    Returns an ordered list from root to the given folder:
    [{"id": 1, "name": "Documents"}, {"id": 5, "name": "Projects"}]
    """
    return storage_service.get_breadcrumbs(db, user.id, file_id)


# ═══════════════════════════════════════════════════════════
# Modify & Delete
# ═══════════════════════════════════════════════════════════

@router.put("/{file_id}/rename", response_model=FileResponse)
def rename_file(
    file_id: int,
    data: FileRename,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a file or folder."""
    try:
        current_file = storage_service.get_file(db, user.id, file_id)
        old_name = current_file.name if current_file else ""
        file = storage_service.rename_file(db, user.id, file_id, data.name)
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="RENAME",
            item_name=file.name,
            details=f"Renamed '{old_name}' to '{file.name}'",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return file


@router.put("/{file_id}/move", response_model=FileResponse)
def move_file(
    file_id: int,
    data: FileMove,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Move a file or folder to a different location."""
    try:
        file = storage_service.move_file(db, user.id, file_id, data.parent_id)
        dest_desc = "root directory"
        if data.parent_id is not None:
            dest_folder = storage_service.get_file(db, user.id, data.parent_id)
            dest_desc = f"folder '{dest_folder.name}'" if dest_folder else f"folder #{data.parent_id}"
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="MOVE",
            item_name=file.name,
            details=f"Moved '{file.name}' to {dest_desc}",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return file


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a file or folder (and all its children)."""
    target = storage_service.get_file(db, user.id, file_id)
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    item_name = target.name
    item_type = "folder" if target.is_folder else "file"

    try:
        storage_service.delete_file(db, user.id, file_id)
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="DELETE",
            item_name=item_name,
            details=f"Deleted {item_type} '{item_name}'",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
