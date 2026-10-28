"""
Admin & System Monitoring Schemas (Pydantic)
===========================================
Defines request and response schemas for system metrics, host information,
and administrative user management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ─── System Metrics Schemas ──────────────────────────────────────────

class CPUInfo(BaseModel):
    """Detailed CPU load and architecture metrics."""
    percent: float = Field(..., description="Overall CPU utilization percentage (0-100)")
    cores_logical: int = Field(..., description="Number of logical CPU cores")
    cores_physical: int = Field(..., description="Number of physical CPU cores")
    frequency_mhz: Optional[float] = Field(None, description="Current CPU frequency in MHz")


class MemoryInfo(BaseModel):
    """Host virtual memory (RAM) statistics."""
    total_bytes: int = Field(..., description="Total physical memory in bytes")
    available_bytes: int = Field(..., description="Available memory for processes without swapping")
    used_bytes: int = Field(..., description="Currently used physical memory")
    percent: float = Field(..., description="Memory utilization percentage")


class DiskInfo(BaseModel):
    """Storage partition metrics for the application drive."""
    total_bytes: int = Field(..., description="Total storage capacity in bytes")
    used_bytes: int = Field(..., description="Used storage capacity in bytes")
    free_bytes: int = Field(..., description="Free storage capacity in bytes")
    percent: float = Field(..., description="Disk utilization percentage")
    path: str = Field(..., description="Mount point or checked path")


class ProcessInfo(BaseModel):
    """FastAPI server process specific resource footprint."""
    memory_rss_bytes: int = Field(..., description="Resident Set Size (non-swapped physical memory)")
    cpu_percent: float = Field(..., description="Process CPU usage percentage")
    threads_count: int = Field(..., description="Number of active threads spawned by the process")


class SystemMetricsResponse(BaseModel):
    """Comprehensive real-time host and process health payload."""
    timestamp: datetime
    platform: str
    os_version: str
    hostname: str
    boot_time: datetime
    uptime_seconds: int
    cpu: CPUInfo
    memory: MemoryInfo
    disk: DiskInfo
    process: ProcessInfo


# ─── Admin User Management Schemas ──────────────────────────────────

class AdminUserSummary(BaseModel):
    """User profile overview enriched with storage usage and file count."""
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    storage_quota_bytes: int
    used_storage_bytes: int
    storage_percent: float
    file_count: int
    folder_count: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """Paginated list and system-wide totals."""
    total_users: int
    active_users: int
    admin_users: int
    total_storage_allocated_bytes: int
    total_storage_used_bytes: int
    users: list[AdminUserSummary]


class UpdateQuotaRequest(BaseModel):
    """Payload to alter a user's storage quota."""
    storage_quota_bytes: int = Field(
        ...,
        gt=0,
        description="New storage quota in bytes (must be greater than 0)"
    )


class UpdateStatusRequest(BaseModel):
    """Payload to activate or suspend a user account."""
    is_active: bool = Field(..., description="True to activate, False to suspend")


class UpdateRoleRequest(BaseModel):
    """Payload to elevate or demote user permissions."""
    role: str = Field(..., pattern=r"^(user|admin)$", description="'user' or 'admin'")
