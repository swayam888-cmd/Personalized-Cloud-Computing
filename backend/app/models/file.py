"""
File Model
==========
Defines the 'files' table in the database.

HOW THE FILE SYSTEM WORKS:
- Every file AND folder is a row in this table
- is_folder=True means it's a folder, False means it's a file
- parent_id creates the folder hierarchy (NULL = root level)
- storage_path is the physical path on disk (only for files, not folders)
- Each file belongs to exactly one user (owner_id → users.id)

FOLDER HIERARCHY EXAMPLE:
    Root (parent_id=NULL)
    ├── Documents (is_folder=True, parent_id=NULL)
    │   ├── report.pdf (is_folder=False, parent_id=Documents.id)
    │   └── notes.txt  (is_folder=False, parent_id=Documents.id)
    └── photo.jpg (is_folder=False, parent_id=NULL)

PHYSICAL STORAGE:
    Files are stored on disk as: storage/<user_id>/<uuid>
    The UUID filename prevents collisions. The original filename
    is stored in the 'name' column for display purposes.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, BigInteger,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database.session import Base


class File(Base):
    """
    The files table.

    Stores metadata for every file and folder in the system.
    The actual file content lives on disk at `storage_path`.
    """

    __tablename__ = "files"

    # ─── Primary Key ─────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ─── File/Folder Info ────────────────────────────────
    # Display name (e.g., "report.pdf" or "My Documents")
    name = Column(String, nullable=False)

    # True for folders, False for files
    is_folder = Column(Boolean, default=False, nullable=False)

    # MIME type (e.g., "application/pdf", "image/png")
    # NULL for folders since they don't have content
    mime_type = Column(String, nullable=True)

    # File size in bytes (0 for folders)
    size_bytes = Column(BigInteger, default=0, nullable=False)

    # Physical path on disk, relative to STORAGE_DIR
    # e.g., "42/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    # NULL for folders (they don't have physical storage)
    storage_path = Column(String, nullable=True)

    # ─── Hierarchy ───────────────────────────────────────
    # Self-referential: parent folder's ID
    # NULL means the item is at the root level
    parent_id = Column(
        Integer,
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # ─── Ownership ───────────────────────────────────────
    # Every file/folder belongs to one user
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Timestamps ──────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ───────────────────────────────────
    # Access the owner: file.owner → User object
    owner = relationship("User", back_populates="files")

    # Access parent folder: file.parent → File object
    parent = relationship(
        "File",
        remote_side=[id],
        back_populates="children",
    )

    # Access children: folder.children → [File, File, ...]
    children = relationship(
        "File",
        back_populates="parent",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
