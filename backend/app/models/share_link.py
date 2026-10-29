"""
Share Link Model
================
Defines the 'share_links' table in the database.

PURPOSE:
Every time a user shares a file, a ShareLink row is created. This enables
token-based public file access without requiring the recipient to have an
account on the platform.

HOW SHARE LINKS WORK:
1. User selects a file and clicks "Share"
2. A ShareLink is created with a unique UUID token
3. The share URL looks like: /s/<token>
4. Anyone with the URL can access the file's metadata and download it
5. Optional protections: password, expiry date, download limits

SECURITY FEATURES:
- Token: UUID4 — random, unguessable, URL-safe
- Password: optional bcrypt hash (same as user auth)
- Expiry: optional datetime after which the link is dead
- Max Downloads: optional cap on how many times the file can be fetched
- is_active: manual kill switch for instant revocation

EXAMPLE:
    share = ShareLink(
        file_id=42,
        owner_id=1,
        token="a3b9c7d1-e5f6-7890-abcd-ef1234567890",
        expires_at=datetime(2026, 12, 31, tzinfo=timezone.utc),
        max_downloads=10,
    )
    db.add(share)
    db.commit()
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, BigInteger,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database.session import Base


class ShareLink(Base):
    """
    The share_links table.

    Each row represents a single shareable link to a file.
    A file can have multiple active share links (e.g., one with a
    password and one without, or links with different expiry dates).
    """

    __tablename__ = "share_links"

    # ─── Primary Key ─────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ─── Token ───────────────────────────────────────────
    # The unique, unguessable identifier used in the share URL.
    # e.g., "a3b9c7d1-e5f6-7890-abcd-ef1234567890"
    # Indexed for fast lookups from the public download endpoint.
    token = Column(String, unique=True, index=True, nullable=False)

    # ─── File Reference ──────────────────────────────────
    # The file being shared. CASCADE: if the file is deleted,
    # all its share links are automatically cleaned up.
    file_id = Column(
        Integer,
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Owner Reference ─────────────────────────────────
    # The user who created this share link.
    # Must be the owner of the file. CASCADE on delete.
    owner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Password Protection ─────────────────────────────
    # If True, the recipient must enter a password to download.
    is_password_protected = Column(
        Boolean, default=False, nullable=False,
    )

    # Bcrypt hash of the password (NULL if not password-protected).
    hashed_password = Column(String, nullable=True)

    # ─── Expiration ──────────────────────────────────────
    # Optional expiry datetime. After this time the link is dead.
    # NULL means the link never expires.
    expires_at = Column(DateTime, nullable=True)

    # ─── Download Limits ─────────────────────────────────
    # Maximum number of times this link can be used to download.
    # NULL means unlimited downloads.
    max_downloads = Column(Integer, nullable=True)

    # Current download count. Incremented on each successful download.
    download_count = Column(Integer, default=0, nullable=False)

    # ─── Status ──────────────────────────────────────────
    # Manual kill switch. Set to False to instantly revoke access.
    is_active = Column(Boolean, default=True, nullable=False)

    # ─── Timestamps ──────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )

    # ─── Relationships ───────────────────────────────────
    # Access the shared file: share.file → File object
    file = relationship("File", back_populates="share_links")

    # Access the creator: share.owner → User object
    owner = relationship("User", back_populates="share_links")
