"""
Storage Service
===============
All file and folder business logic lives here.

DESIGN DECISIONS:

1. FLAT PHYSICAL STORAGE:
   Files on disk are stored as: storage/<user_id>/<uuid>
   We use UUIDs as filenames to avoid collisions. The original
   filename is stored in the database 'name' column.
   Folders exist ONLY in the database — no physical directories
   are created for logical folders.

2. OWNERSHIP CHECKS:
   Every operation verifies that the requesting user owns the file.
   This prevents users from accessing each other's files.

3. QUOTA ENFORCEMENT:
   Before saving a file, we check if the user has enough quota.
   Used space is calculated by summing size_bytes of all user's files.

4. CASCADE DELETES:
   When deleting a folder, we recursively delete all children
   (both from the database and from disk).
"""

import os
import uuid
import shutil
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.file import File
from app.models.user import User


def _get_storage_root() -> Path:
    """
    Get the absolute path to the storage root directory.
    Creates it if it doesn't exist.
    """
    storage_root = Path(settings.STORAGE_DIR)
    storage_root.mkdir(parents=True, exist_ok=True)
    return storage_root


def _get_user_dir(user_id: int) -> Path:
    """
    Get the storage directory for a specific user.
    Creates it if it doesn't exist.

    Layout: storage/<user_id>/
    """
    user_dir = _get_storage_root() / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir


# ═══════════════════════════════════════════════════════════
# Storage Stats
# ═══════════════════════════════════════════════════════════

def get_used_bytes(db: Session, user_id: int) -> int:
    """Calculate total bytes used by a user's files."""
    result = (
        db.query(func.coalesce(func.sum(File.size_bytes), 0))
        .filter(File.owner_id == user_id, File.is_folder == False)  # noqa: E712
        .scalar()
    )
    return int(result)


DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".bmp"}
MEDIA_EXTENSIONS = {".mp4", ".mp3", ".wav", ".mkv", ".avi", ".mov", ".flac"}


def categorize_file(filename: str) -> str:
    """Classify a file into documents, images, media, or other based on its extension."""
    ext = os.path.splitext(filename)[1].lower()
    if ext in DOCUMENT_EXTENSIONS:
        return "documents"
    elif ext in IMAGE_EXTENSIONS:
        return "images"
    elif ext in MEDIA_EXTENSIONS:
        return "media"
    return "other"


def get_storage_stats(db: Session, user: User) -> dict:
    """
    Get comprehensive storage stats for a user.

    Returns:
        Dictionary with used_bytes, quota_bytes, remaining_bytes, used_percentage,
        file_count, folder_count
    """
    used_bytes = get_used_bytes(db, user.id)

    file_count = (
        db.query(func.count(File.id))
        .filter(File.owner_id == user.id, File.is_folder == False)  # noqa: E712
        .scalar()
    )

    folder_count = (
        db.query(func.count(File.id))
        .filter(File.owner_id == user.id, File.is_folder == True)  # noqa: E712
        .scalar()
    )

    remaining_bytes = max(0, user.storage_quota_bytes - used_bytes)
    used_percentage = (
        round((used_bytes / user.storage_quota_bytes) * 100, 2)
        if user.storage_quota_bytes > 0
        else 0.0
    )

    return {
        "used_bytes": used_bytes,
        "quota_bytes": user.storage_quota_bytes,
        "remaining_bytes": remaining_bytes,
        "used_percentage": used_percentage,
        "file_count": file_count,
        "folder_count": folder_count,
    }


def get_storage_analytics(db: Session, user: User) -> dict:
    """
    Get detailed storage analytics for a user including breakdown by category:
    Documents, Images, Media, Other.
    """
    stats = get_storage_stats(db, user)
    used_bytes = stats["used_bytes"]

    categories = {
        "documents": {"name": "documents", "size_bytes": 0, "file_count": 0, "percentage": 0.0},
        "images": {"name": "images", "size_bytes": 0, "file_count": 0, "percentage": 0.0},
        "media": {"name": "media", "size_bytes": 0, "file_count": 0, "percentage": 0.0},
        "other": {"name": "other", "size_bytes": 0, "file_count": 0, "percentage": 0.0},
    }

    files = (
        db.query(File.name, File.size_bytes)
        .filter(File.owner_id == user.id, File.is_folder == False)  # noqa: E712
        .all()
    )

    for f_name, f_size in files:
        cat = categorize_file(f_name)
        categories[cat]["size_bytes"] += f_size
        categories[cat]["file_count"] += 1

    if used_bytes > 0:
        for cat in categories.values():
            cat["percentage"] = round((cat["size_bytes"] / used_bytes) * 100, 1)

    return {
        **stats,
        "categories": categories,
    }


# ═══════════════════════════════════════════════════════════
# File Operations
# ═══════════════════════════════════════════════════════════

def list_folder_contents(
    db: Session,
    user_id: int,
    parent_id: int | None = None,
) -> list[File]:
    """
    List all files and folders inside a given folder (or root).

    Args:
        db: Database session
        user_id: The requesting user's ID
        parent_id: The folder to list (None = root level)

    Returns:
        List of File objects, folders first, then files, alphabetically
    """
    query = (
        db.query(File)
        .filter(File.owner_id == user_id, File.parent_id == parent_id)
        .order_by(File.is_folder.desc(), File.name.asc())
    )
    return query.all()


def get_file(db: Session, user_id: int, file_id: int) -> File | None:
    """
    Fetch a single file/folder by ID, with ownership check.

    Returns None if not found or not owned by user.
    """
    return (
        db.query(File)
        .filter(File.id == file_id, File.owner_id == user_id)
        .first()
    )


async def save_uploaded_file(
    db: Session,
    user: User,
    upload_file,
    parent_id: int | None = None,
) -> File:
    """
    Save an uploaded file to disk and create a database record.

    Steps:
    1. Validate parent folder (if specified)
    2. Read file content and check size limits
    3. Check storage quota
    4. Write to disk with UUID filename
    5. Create database record

    Args:
        db: Database session
        user: The authenticated user
        upload_file: FastAPI UploadFile object
        parent_id: Folder to upload into (None = root)

    Returns:
        The newly created File record

    Raises:
        ValueError: If parent is not a folder, file too large, or quota exceeded
    """
    # Validate parent folder
    if parent_id is not None:
        parent = get_file(db, user.id, parent_id)
        if parent is None:
            raise ValueError("Parent folder not found")
        if not parent.is_folder:
            raise ValueError("Parent is not a folder")

    # Read file content
    content = await upload_file.read()
    file_size = len(content)

    # Check max file size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise ValueError(
            f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB} MB"
        )

    # Check quota
    used = get_used_bytes(db, user.id)
    if used + file_size > user.storage_quota_bytes:
        raise ValueError(
            "Storage quota exceeded. Delete some files to free up space"
        )

    # Save to disk with UUID filename
    user_dir = _get_user_dir(user.id)
    unique_name = str(uuid.uuid4())
    file_path = user_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    # Determine MIME type
    mime_type = upload_file.content_type or "application/octet-stream"

    # Create database record
    # storage_path is relative: "<user_id>/<uuid>"
    relative_path = f"{user.id}/{unique_name}"

    db_file = File(
        name=upload_file.filename or "unnamed",
        is_folder=False,
        mime_type=mime_type,
        size_bytes=file_size,
        storage_path=relative_path,
        parent_id=parent_id,
        owner_id=user.id,
    )

    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


def create_folder(
    db: Session,
    user: User,
    name: str,
    parent_id: int | None = None,
) -> File:
    """
    Create a new folder.

    Folders are logical — they only exist in the database, not on disk.
    Files inside folders are still stored in flat storage/<user_id>/ dir.

    Args:
        db: Database session
        user: The authenticated user
        name: Folder name
        parent_id: Parent folder ID (None = root level)

    Returns:
        The newly created folder record

    Raises:
        ValueError: If parent doesn't exist or isn't a folder,
                    or if a folder with the same name already exists
    """
    # Validate parent
    if parent_id is not None:
        parent = get_file(db, user.id, parent_id)
        if parent is None:
            raise ValueError("Parent folder not found")
        if not parent.is_folder:
            raise ValueError("Parent is not a folder")

    # Check for duplicate folder name in same location
    existing = (
        db.query(File)
        .filter(
            File.owner_id == user.id,
            File.parent_id == parent_id,
            File.is_folder == True,  # noqa: E712
            File.name == name,
        )
        .first()
    )
    if existing:
        raise ValueError(f"A folder named '{name}' already exists here")

    folder = File(
        name=name,
        is_folder=True,
        mime_type=None,
        size_bytes=0,
        storage_path=None,
        parent_id=parent_id,
        owner_id=user.id,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return folder


def rename_file(
    db: Session,
    user_id: int,
    file_id: int,
    new_name: str,
) -> File:
    """
    Rename a file or folder.

    Args:
        db: Database session
        user_id: The requesting user's ID
        file_id: ID of the file/folder to rename
        new_name: New name

    Returns:
        The updated File record

    Raises:
        ValueError: If file not found or name conflict
    """
    file = get_file(db, user_id, file_id)
    if file is None:
        raise ValueError("File not found")

    # Check for name conflict in the same folder
    conflict = (
        db.query(File)
        .filter(
            File.owner_id == user_id,
            File.parent_id == file.parent_id,
            File.name == new_name,
            File.id != file_id,
        )
        .first()
    )
    if conflict:
        raise ValueError(f"An item named '{new_name}' already exists here")

    file.name = new_name
    db.commit()
    db.refresh(file)

    return file


def move_file(
    db: Session,
    user_id: int,
    file_id: int,
    new_parent_id: int | None,
) -> File:
    """
    Move a file or folder to a different location.

    Args:
        db: Database session
        user_id: The requesting user's ID
        file_id: ID of the file/folder to move
        new_parent_id: Destination folder ID (None = move to root)

    Returns:
        The updated File record

    Raises:
        ValueError: If file or destination not found, or circular reference
    """
    file = get_file(db, user_id, file_id)
    if file is None:
        raise ValueError("File not found")

    # Can't move to the same location
    if file.parent_id == new_parent_id:
        raise ValueError("File is already in this location")

    # Validate destination
    if new_parent_id is not None:
        dest = get_file(db, user_id, new_parent_id)
        if dest is None:
            raise ValueError("Destination folder not found")
        if not dest.is_folder:
            raise ValueError("Destination is not a folder")

        # Prevent moving a folder into itself or its descendants
        if file.is_folder:
            if _is_descendant(db, user_id, new_parent_id, file_id):
                raise ValueError("Cannot move a folder into itself or its subfolder")

    file.parent_id = new_parent_id
    db.commit()
    db.refresh(file)

    return file


def _is_descendant(
    db: Session,
    user_id: int,
    folder_id: int,
    ancestor_id: int,
) -> bool:
    """
    Check if folder_id is a descendant of ancestor_id.
    Used to prevent circular moves.
    """
    current_id = folder_id
    visited = set()

    while current_id is not None:
        if current_id == ancestor_id:
            return True
        if current_id in visited:
            break  # Safety: prevent infinite loops
        visited.add(current_id)

        folder = get_file(db, user_id, current_id)
        if folder is None:
            break
        current_id = folder.parent_id

    return False


def delete_file(db: Session, user_id: int, file_id: int) -> bool:
    """
    Delete a file or folder (and all its children recursively).

    For files: removes the physical file from disk and the DB record.
    For folders: recursively deletes all children first.

    Args:
        db: Database session
        user_id: The requesting user's ID
        file_id: ID of the file/folder to delete

    Returns:
        True if deleted successfully

    Raises:
        ValueError: If file not found
    """
    file = get_file(db, user_id, file_id)
    if file is None:
        raise ValueError("File not found")

    if file.is_folder:
        # Recursively delete all children
        children = (
            db.query(File)
            .filter(File.owner_id == user_id, File.parent_id == file_id)
            .all()
        )
        for child in children:
            delete_file(db, user_id, child.id)

    # Delete physical file from disk
    if file.storage_path:
        file_path = _get_storage_root() / file.storage_path
        if file_path.exists():
            file_path.unlink()

    db.delete(file)
    db.commit()

    return True


def get_file_path(db: Session, user_id: int, file_id: int) -> Path | None:
    """
    Get the absolute path to a file on disk (for downloads).

    Returns None if file not found, is a folder, or physical file is missing.
    """
    file = get_file(db, user_id, file_id)
    if file is None or file.is_folder or not file.storage_path:
        return None

    file_path = _get_storage_root() / file.storage_path
    if not file_path.exists():
        return None

    return file_path


def get_breadcrumbs(
    db: Session,
    user_id: int,
    folder_id: int | None,
) -> list[dict]:
    """
    Build the breadcrumb trail for a folder.

    Starting from the given folder, walks up the parent chain
    to build the navigation path.

    Example: for /Documents/Projects/Sprint3, returns:
    [
        {"id": 1, "name": "Documents"},
        {"id": 5, "name": "Projects"},
        {"id": 12, "name": "Sprint3"},
    ]

    Args:
        db: Database session
        user_id: The requesting user's ID
        folder_id: The folder to get breadcrumbs for (None = root)

    Returns:
        List of {"id": ..., "name": ...} from root down to the given folder
    """
    if folder_id is None:
        return []

    breadcrumbs = []
    current_id = folder_id
    visited = set()

    while current_id is not None:
        if current_id in visited:
            break  # Safety: prevent infinite loops
        visited.add(current_id)

        folder = get_file(db, user_id, current_id)
        if folder is None:
            break

        breadcrumbs.append({"id": folder.id, "name": folder.name})
        current_id = folder.parent_id

    breadcrumbs.reverse()  # Root-first order
    return breadcrumbs
