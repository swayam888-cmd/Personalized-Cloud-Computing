"""
Activity Model
==============
Defines the 'activities' table in the database.

PURPOSE:
Every important user action in the cloud platform is recorded as an
Activity row. This creates an audit trail — a chronological log of
who did what and when.

WHY ACTIVITY LOGGING MATTERS:
1. Security: detect suspicious access patterns
2. Transparency: users can see their own action history
3. Debugging: trace what happened before an error
4. Cloud standard: AWS CloudTrail, Google Cloud Audit Logs, Azure
   Activity Log — every real cloud platform logs user actions

WHAT WE LOG:
- LOGIN        — user authenticated successfully
- UPLOAD       — file uploaded to storage
- DOWNLOAD     — file downloaded from storage
- DELETE       — file or folder deleted
- RENAME       — file or folder renamed
- MOVE         — file or folder moved to a different location
- CREATE_FOLDER — new folder created

WHAT WE NEVER LOG:
- Passwords (plain-text or hashed)
- JWT tokens
- Secret keys
- Any authentication secrets

EXAMPLE:
    activity = Activity(
        user_id=1,
        action="UPLOAD",
        item_name="report.pdf",
        details="Uploaded to /Documents (2.1 MB)",
    )
    db.add(activity)
    db.commit()
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class Activity(Base):
    """
    The activities table.

    Every significant user action creates one row in this table.
    Activities always belong to a single user and are ordered
    by timestamp for chronological display.
    """

    __tablename__ = "activities"

    # ─── Primary Key ─────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ─── Ownership ───────────────────────────────────────
    # Every activity belongs to one user.
    # CASCADE: if the user is deleted, their activities are deleted too.
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ─── Action ──────────────────────────────────────────
    # A short verb describing what happened.
    # Examples: "LOGIN", "UPLOAD", "DOWNLOAD", "DELETE",
    #           "RENAME", "MOVE", "CREATE_FOLDER"
    action = Column(String, nullable=False)

    # ─── Item Name ───────────────────────────────────────
    # The human-readable name of the file or folder involved.
    # For LOGIN events, this can be null since no file is involved.
    item_name = Column(String, nullable=True)

    # ─── Details ─────────────────────────────────────────
    # Optional extra context about the action.
    # Examples: "Uploaded to /Documents (2.1 MB)", "Renamed to new-name.txt"
    # Uses Text type for flexibility with longer descriptions.
    details = Column(Text, nullable=True)

    # ─── Timestamp ───────────────────────────────────────
    # When the action occurred. Defaults to the current UTC time.
    timestamp = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # ─── Relationships ───────────────────────────────────
    # Access the user who performed this action: activity.user → User
    user = relationship("User", back_populates="activities")
