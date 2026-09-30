"""
Activity Schemas (Pydantic)
===========================
Schemas for Activity audit trail and event logging.

These schemas define the shape of activity records returned to the client
for user activity feeds, audit logs, and recent action summaries.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ActivityResponse(BaseModel):
    """
    Representation of a single user activity record.
    """

    id: int
    user_id: int
    action: str
    item_name: str | None = None
    details: str | None = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    """
    Paginated list of activity records.
    """

    items: list[ActivityResponse]
    total: int = Field(..., ge=0, description="Total number of activity records for this user")
    limit: int = Field(..., ge=1, description="Page limit applied")
    offset: int = Field(..., ge=0, description="Offset applied")
