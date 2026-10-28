"""
Admin Service
=============
Business logic for administrator operations:
- Querying users and calculating per-user storage consumption
- Updating user storage quotas
- Activating / suspending user accounts
- Modifying user roles with self-lockout safeguards
"""

import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import User, File
from app.schemas.admin import AdminUserSummary, AdminUserListResponse
from app.services import activity as activity_service

logger = logging.getLogger(__name__)


def _compute_user_stats(db: Session, user: User) -> dict:
    """Compute file count, folder count, and storage used in bytes for a user."""
    # Sum size of all non-folder files owned by user
    used_bytes = (
        db.query(func.coalesce(func.sum(File.size_bytes), 0))
        .filter(File.owner_id == user.id, File.is_folder == False)  # noqa: E712
        .scalar()
    ) or 0

    file_count = (
        db.query(func.count(File.id))
        .filter(File.owner_id == user.id, File.is_folder == False)  # noqa: E712
        .scalar()
    ) or 0

    folder_count = (
        db.query(func.count(File.id))
        .filter(File.owner_id == user.id, File.is_folder == True)  # noqa: E712
        .scalar()
    ) or 0

    quota = user.storage_quota_bytes or 1073741824  # default 1 GB
    storage_percent = min(100.0, round((used_bytes / quota) * 100, 2)) if quota > 0 else 0.0

    return {
        "used_storage_bytes": int(used_bytes),
        "storage_percent": float(storage_percent),
        "file_count": int(file_count),
        "folder_count": int(folder_count),
    }


def get_user_summary(db: Session, user: User) -> AdminUserSummary:
    """Build an AdminUserSummary schema object for a given user."""
    stats = _compute_user_stats(db, user)
    return AdminUserSummary(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        storage_quota_bytes=user.storage_quota_bytes,
        used_storage_bytes=stats["used_storage_bytes"],
        storage_percent=stats["storage_percent"],
        file_count=stats["file_count"],
        folder_count=stats["folder_count"],
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def get_all_users_summary(db: Session) -> AdminUserListResponse:
    """
    Retrieve all registered users with their individual storage usage,
    plus system-wide aggregated metrics.
    """
    users = db.query(User).order_by(User.id.asc()).all()

    summaries: list[AdminUserSummary] = []
    total_allocated = 0
    total_used = 0
    active_count = 0
    admin_count = 0

    for u in users:
        summary = get_user_summary(db, u)
        summaries.append(summary)

        total_allocated += u.storage_quota_bytes or 0
        total_used += summary.used_storage_bytes
        if u.is_active:
            active_count += 1
        if u.role == "admin":
            admin_count += 1

    return AdminUserListResponse(
        total_users=len(users),
        active_users=active_count,
        admin_users=admin_count,
        total_storage_allocated_bytes=total_allocated,
        total_storage_used_bytes=total_used,
        users=summaries,
    )


def update_user_quota(
    db: Session,
    admin: User,
    user_id: int,
    new_quota_bytes: int,
) -> AdminUserSummary:
    """
    Adjust a user's storage quota in bytes.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    old_quota = user.storage_quota_bytes
    user.storage_quota_bytes = new_quota_bytes
    db.commit()
    db.refresh(user)

    old_str = activity_service.format_file_size(old_quota)
    new_str = activity_service.format_file_size(new_quota_bytes)
    activity_service.log_activity(
        db=db,
        user_id=admin.id,
        action="ADMIN_UPDATE_QUOTA",
        item_name=user.username,
        details=f"Admin {admin.username} updated quota for {user.username} from {old_str} to {new_str}",
    )

    return get_user_summary(db, user)


def update_user_status(
    db: Session,
    admin: User,
    user_id: int,
    is_active: bool,
) -> AdminUserSummary:
    """
    Activate or suspend a user account.
    Prevents administrators from disabling their own account.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    if user.id == admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot suspend their own account",
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    action_label = "ADMIN_ACTIVATE_USER" if is_active else "ADMIN_SUSPEND_USER"
    status_text = "activated" if is_active else "suspended"
    activity_service.log_activity(
        db=db,
        user_id=admin.id,
        action=action_label,
        item_name=user.username,
        details=f"Admin {admin.username} {status_text} account for {user.username}",
    )

    return get_user_summary(db, user)


def update_user_role(
    db: Session,
    admin: User,
    user_id: int,
    role: str,
) -> AdminUserSummary:
    """
    Promote or demote a user's role ('user' or 'admin').
    Prevents demoting the last remaining active administrator.
    """
    if role not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'user' or 'admin'",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found",
        )

    if user.id == admin.id and role != "admin":
        other_admins = (
            db.query(User)
            .filter(User.role == "admin", User.id != admin.id, User.is_active == True)  # noqa: E712
            .count()
        )
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote yourself: at least one other active administrator must exist",
            )

    old_role = user.role
    user.role = role
    db.commit()
    db.refresh(user)

    activity_service.log_activity(
        db=db,
        user_id=admin.id,
        action="ADMIN_UPDATE_ROLE",
        item_name=user.username,
        details=f"Admin {admin.username} changed role of {user.username} from {old_role} to {role}",
    )

    return get_user_summary(db, user)
