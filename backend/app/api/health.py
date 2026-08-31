"""
Health Check API
================
The simplest possible endpoint — but it serves a critical purpose.

WHAT IT DOES:
- Returns the backend status
- Checks if the database is reachable
- Reports the application version

WHY WE NEED IT:
1. Verify the backend is running after deployment
2. Verify the database connection is alive
3. The frontend can call this to show connection status
4. Later, Docker and monitoring tools use health checks to
   detect and restart unhealthy containers

This is a standard pattern in cloud platforms — every
production service exposes a /health endpoint.
"""

from fastapi import APIRouter

from app.core.config import settings
from app.database.session import check_database_connection

# Create a router for health-related endpoints
# prefix="/health" means all routes here start with /api/health
# (the /api prefix is added in main.py when we include this router)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def health_check():
    """
    Health check endpoint.

    Returns:
        JSON with status, database connection state, and version.

    Example response:
        {
            "status": "healthy",
            "database": "connected",
            "version": "0.1.0"
        }
    """
    db_connected = check_database_connection()

    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "version": settings.APP_VERSION,
    }
