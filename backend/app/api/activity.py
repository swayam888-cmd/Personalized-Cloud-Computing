"""
Activity API Routes
===================
Endpoints for viewing the current user's activity audit trail.

All routes are PROTECTED — they require a valid JWT token.
All operations are scoped to the authenticated user's activities only.

ENDPOINTS:
    GET  /api/activities/         → List activities (paginated, filterable)
    GET  /api/activities/summary  → Quick summary counts by action type

DESIGN NOTES:
    - Activities are read-only from the API perspective. They are written
      internally by other endpoints (auth, files) via activity_service.
    - The `action` query parameter filters by action type:
      REGISTER, LOGIN, UPLOAD, DOWNLOAD, DELETE, RENAME, MOVE, CREATE_FOLDER
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityResponse, ActivityListResponse
from app.services import activity as activity_service

router = APIRouter(prefix="/activities", tags=["Activities"])


# All known action types for validation hints and summary
ACTION_TYPES = [
    "REGISTER",
    "LOGIN",
    "UPLOAD",
    "DOWNLOAD",
    "DELETE",
    "RENAME",
    "MOVE",
    "CREATE_FOLDER",
]


@router.get("/", response_model=ActivityListResponse)
def list_activities(
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of records per page (1–100)",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of records to skip for pagination",
    ),
    action: str | None = Query(
        default=None,
        description=(
            "Filter by action type. "
            "Allowed values: REGISTER, LOGIN, UPLOAD, DOWNLOAD, "
            "DELETE, RENAME, MOVE, CREATE_FOLDER"
        ),
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List the current user's activities (newest first).

    Supports pagination via `limit` and `offset`, and filtering
    by `action` type.

    Examples:
        GET /api/activities/                     → latest 20 activities
        GET /api/activities/?limit=5             → latest 5 activities
        GET /api/activities/?action=UPLOAD       → only upload events
        GET /api/activities/?limit=10&offset=10  → page 2 (10 per page)
    """
    activities = activity_service.get_user_activities(
        db=db,
        user_id=user.id,
        limit=limit,
        offset=offset,
        action=action,
    )
    total = activity_service.get_activity_count(
        db=db,
        user_id=user.id,
        action=action,
    )

    return ActivityListResponse(
        items=[ActivityResponse.model_validate(a) for a in activities],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/summary")
def activity_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a summary of the user's activities grouped by action type.

    Returns a dictionary with the count for each known action type,
    plus the overall total.

    Example response:
        {
            "total": 42,
            "actions": {
                "LOGIN": 10,
                "UPLOAD": 15,
                "DOWNLOAD": 8,
                "DELETE": 3,
                "RENAME": 2,
                "MOVE": 1,
                "CREATE_FOLDER": 2,
                "REGISTER": 1
            }
        }
    """
    total = activity_service.get_activity_count(db, user.id)
    actions = {}
    for action_type in ACTION_TYPES:
        count = activity_service.get_activity_count(db, user.id, action=action_type)
        actions[action_type] = count

    return {
        "total": total,
        "actions": actions,
    }
