# backend/app/api package
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.files import router as files_router
from app.api.activity import router as activity_router
from app.api.network import router as network_router
from app.api.admin import router as admin_router

__all__ = [
    "health_router",
    "auth_router",
    "users_router",
    "files_router",
    "activity_router",
    "network_router",
    "admin_router",
]
