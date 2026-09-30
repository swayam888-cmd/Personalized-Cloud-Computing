"""
Activity Service
================
All activity logging and audit trail business logic lives here.

PURPOSE:
Provides reliable recording and querying of user action logs (auditing).
Every significant user operation (auth, uploads, downloads, modifications)
is recorded via `log_activity()`.

FAULT TOLERANCE:
Activity logging is designed never to interrupt the primary user action:
if writing an activity record encounters a database issue, the error is
logged to standard logging output, but the user operation completes.
"""

import logging
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.activity import Activity

logger = logging.getLogger(__name__)


def format_file_size(size_bytes: int) -> str:
    """
    Format a byte count into a human-readable string.

    Examples:
        500 -> "500 B"
        1024 -> "1.0 KB"
        1048576 -> "1.0 MB"
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def log_activity(
    db: Session,
    user_id: int,
    action: str,
    item_name: str | None = None,
    details: str | None = None,
) -> Activity | None:
    """
    Record a new user activity into the audit trail.

    Args:
        db: Active SQLAlchemy database session
        user_id: ID of the user performing the action
        action: Short descriptive verb (e.g. 'LOGIN', 'UPLOAD', 'DELETE')
        item_name: Optional name of the affected file/folder
        details: Optional additional context or metadata

    Returns:
        The newly created Activity instance, or None if logging failed.
    """
    try:
        activity = Activity(
            user_id=user_id,
            action=action.upper(),
            item_name=item_name,
            details=details,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as exc:
        logger.error(
            "Failed to record activity for user %s [action=%s]: %s",
            user_id,
            action,
            exc,
            exc_info=True,
        )
        db.rollback()
        return None


def get_user_activities(
    db: Session,
    user_id: int,
    limit: int = 20,
    offset: int = 0,
) -> list[Activity]:
    """
    Retrieve chronological activities for a user (newest first).

    Args:
        db: Active database session
        user_id: ID of the user
        limit: Maximum number of records to return
        offset: Offset for pagination

    Returns:
        List of Activity model instances.
    """
    return (
        db.query(Activity)
        .filter(Activity.user_id == user_id)
        .order_by(Activity.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_activity_count(db: Session, user_id: int) -> int:
    """
    Get the total count of activities for a user.

    Args:
        db: Active database session
        user_id: ID of the user

    Returns:
        Total number of recorded activities.
    """
    count = (
        db.query(func.count(Activity.id))
        .filter(Activity.user_id == user_id)
        .scalar()
    )
    return int(count or 0)
