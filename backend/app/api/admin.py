"""
Admin API Routes
================
Protected endpoints for system resource monitoring and user administration.
All endpoints require a valid JWT token belonging to an account with 'admin' role.
"""

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.database.session import get_db
from app.models import User
from app.schemas.admin import (
    SystemMetricsResponse,
    AdminUserListResponse,
    AdminUserSummary,
    UpdateQuotaRequest,
    UpdateStatusRequest,
    UpdateRoleRequest,
)
from app.services import system as system_service
from app.services import admin as admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/metrics", response_model=SystemMetricsResponse)
def get_system_telemetry(
    admin: User = Depends(require_admin),
):
    """
    Get live system hardware and process metrics.
    Includes CPU %, RAM, storage partition capacity, uptime, and host specs.
    Requires administrator privileges.
    """
    return system_service.get_system_metrics()


@router.get("/users", response_model=AdminUserListResponse)
def list_all_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    List all registered user accounts with per-user storage consumption,
    file/folder counts, role, and active status, alongside system totals.
    Requires administrator privileges.
    """
    return admin_service.get_all_users_summary(db=db)


@router.put("/users/{user_id}/quota", response_model=AdminUserSummary)
def modify_user_quota(
    payload: UpdateQuotaRequest,
    user_id: int = Path(..., description="ID of the target user to modify"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Update the storage quota limit (in bytes) for a user.
    Logs an audit activity record of the change.
    Requires administrator privileges.
    """
    return admin_service.update_user_quota(
        db=db,
        admin=admin,
        user_id=user_id,
        new_quota_bytes=payload.storage_quota_bytes,
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserSummary)
def toggle_user_account_status(
    payload: UpdateStatusRequest,
    user_id: int = Path(..., description="ID of the target user to modify"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Activate or suspend a user account.
    Self-suspension by the calling administrator is blocked.
    Logs an audit activity record of the change.
    Requires administrator privileges.
    """
    return admin_service.update_user_status(
        db=db,
        admin=admin,
        user_id=user_id,
        is_active=payload.is_active,
    )


@router.patch("/users/{user_id}/role", response_model=AdminUserSummary)
def modify_user_role(
    payload: UpdateRoleRequest,
    user_id: int = Path(..., description="ID of the target user to modify"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Elevate a user to 'admin' or demote an administrator to 'user'.
    Demoting the last remaining active administrator is prevented.
    Logs an audit activity record of the change.
    Requires administrator privileges.
    """
    return admin_service.update_user_role(
        db=db,
        admin=admin,
        user_id=user_id,
        role=payload.role,
    )
