"""
Sharing Schemas (Pydantic)
==========================
Schemas for file sharing operations.

These define the SHAPE of data for:
- Creating share links (with optional password, expiry, download limit)
- Returning share link metadata (to the owner)
- Returning public share info (to anonymous recipients)

DESIGN NOTES:
- ShareLinkCreate is what the owner sends to create a share link.
- ShareLinkResponse is the full metadata returned to the authenticated owner.
- ShareLinkPublicInfo is the limited metadata returned to anonymous visitors
  (it does NOT expose the owner's identity or internal IDs).
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── Share Link Creation ─────────────────────────────────
class ShareLinkCreate(BaseModel):
    """
    What the client sends when creating a new share link.

    POST /api/shares
    Body: {
        "file_id": 42,
        "password": "secret123",         // optional
        "expires_in_hours": 24,           // optional (null = never)
        "max_downloads": 10               // optional (null = unlimited)
    }
    """

    file_id: int = Field(
        ...,
        description="ID of the file to share",
    )
    password: str | None = Field(
        default=None,
        min_length=1,
        max_length=128,
        description="Optional password to protect the link",
    )
    expires_in_hours: int | None = Field(
        default=None,
        gt=0,
        le=8760,  # max 1 year (365 * 24)
        description="Hours until the link expires (null = never expires)",
    )
    max_downloads: int | None = Field(
        default=None,
        gt=0,
        le=100000,
        description="Max download count (null = unlimited)",
    )


# ─── Share Link Response (for authenticated owner) ──────
class ShareLinkResponse(BaseModel):
    """
    Full share link metadata returned to the owner.

    Includes internal IDs, token, all settings, and usage stats.
    This is what the owner sees in their "My Shares" list.
    """

    id: int
    token: str
    file_id: int
    file_name: str = ""
    file_size_bytes: int = 0
    is_password_protected: bool
    expires_at: datetime | None
    max_downloads: int | None
    download_count: int
    is_active: bool
    created_at: datetime
    share_url: str = ""

    model_config = {"from_attributes": True}


# ─── Public Share Info (for anonymous recipients) ────────
class ShareLinkPublicInfo(BaseModel):
    """
    Limited share metadata returned to anonymous visitors.

    GET /api/public/share/<token>
    Returns just enough info for the download page UI:
    - File name and size (so they know what they're downloading)
    - Whether a password is required
    - Whether the link is still valid

    Does NOT expose: owner info, internal IDs, token, download stats.
    """

    file_name: str
    file_size_bytes: int
    mime_type: str | None
    is_password_protected: bool
    is_expired: bool = False
    is_download_limit_reached: bool = False


# ─── Public Download Request ─────────────────────────────
class ShareDownloadRequest(BaseModel):
    """
    What the anonymous visitor sends to download a password-protected file.

    POST /api/public/share/<token>/download
    Body: { "password": "secret123" }

    For non-password-protected files, the body can be empty or omitted.
    """

    password: str | None = Field(
        default=None,
        description="Password for protected share links",
    )
