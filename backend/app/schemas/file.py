"""
File Schemas (Pydantic)
=======================
Schemas for file and folder operations.

These define the SHAPE of data for:
- Creating folders
- Renaming files/folders
- Moving files/folders
- API responses (file metadata, storage stats)

DESIGN NOTE:
File UPLOADS use multipart/form-data (not JSON), so there's no
"FileCreate" schema. The upload endpoint uses FastAPI's UploadFile
directly and receives parent_id as a form field.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Folder Creation ─────────────────────────────────────
class FolderCreate(BaseModel):
    """
    What the client sends when creating a new folder.

    POST /api/files/folder
    Body: { "name": "My Documents", "parent_id": null }
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Folder name",
    )
    parent_id: int | None = Field(
        default=None,
        description="Parent folder ID (null = root level)",
    )


# ─── Rename ──────────────────────────────────────────────
class FileRename(BaseModel):
    """
    What the client sends when renaming a file or folder.

    PUT /api/files/{id}/rename
    Body: { "name": "new-name.txt" }
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="New name for the file or folder",
    )


# ─── Move ────────────────────────────────────────────────
class FileMove(BaseModel):
    """
    What the client sends when moving a file or folder.

    PUT /api/files/{id}/move
    Body: { "parent_id": 5 }  or  { "parent_id": null }  (move to root)
    """

    parent_id: int | None = Field(
        default=None,
        description="Destination folder ID (null = move to root)",
    )


# ─── File Response ───────────────────────────────────────
class FileResponse(BaseModel):
    """
    What the API returns when showing file/folder info.

    Used for single file metadata AND for items in directory listings.
    """

    id: int
    name: str
    is_folder: bool
    mime_type: str | None
    size_bytes: int
    parent_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Storage Stats ───────────────────────────────────────
class StorageStats(BaseModel):
    """
    Storage usage summary for a user.

    GET /api/files/stats
    Returns: { "used_bytes": 52428800, "quota_bytes": 1073741824, ... }
    """

    used_bytes: int         # Total bytes used by all files
    quota_bytes: int        # Maximum allowed bytes
    file_count: int         # Number of files (not folders)
    folder_count: int       # Number of folders
    remaining_bytes: int = 0
    used_percentage: float = 0.0


# ─── Storage Analytics (Sprint 4) ────────────────────────
class CategoryStats(BaseModel):
    """Storage breakdown for a single category."""
    name: str               # "documents", "images", "media", "other"
    size_bytes: int         # Bytes used in this category
    file_count: int         # Number of files in this category
    percentage: float       # Percentage of total used storage (0.0 to 100.0)


class StorageAnalytics(BaseModel):
    """
    Comprehensive storage analytics for the dashboard.

    GET /api/files/analytics
    """
    used_bytes: int
    quota_bytes: int
    remaining_bytes: int
    used_percentage: float
    file_count: int
    folder_count: int
    categories: dict[str, CategoryStats]
