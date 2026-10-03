"""
FastAPI Application Entry Point
================================
This is the file that creates and configures the entire backend application.

WHAT HAPPENS WHEN THE SERVER STARTS:
1. FastAPI() creates the application object
2. CORS middleware is added (so the browser allows frontend → backend calls)
3. API routers are included (each router is a group of related endpoints)
4. The 'lifespan' hook creates database tables on startup
5. Uvicorn (the ASGI server) serves this app on the configured host:port

KEY CONCEPT — CORS (Cross-Origin Resource Sharing):
When your React app at localhost:5173 tries to call the API at localhost:8000,
the browser blocks it by default (it's a "cross-origin" request — different port).
CORS middleware tells the browser: "Yes, localhost:5173 is allowed to call me."
Without CORS, the frontend fetch() calls would fail with a cryptic error.

SPRINT 5 — LAN MODE:
When LAN_MODE=true, the CORS origins list is dynamically extended with the
server's LAN IP so devices on the same network can access the cloud.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import Base, engine
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.files import router as files_router
from app.api.activity import router as activity_router
from app.api.network import router as network_router

# Import models so SQLAlchemy knows about them when creating tables
from app.models import user as _user_model  # noqa: F401
from app.models import file as _file_model  # noqa: F401
from app.models import activity as _activity_model  # noqa: F401

logger = logging.getLogger(__name__)


# ─── Lifespan (startup/shutdown) ────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on application startup and shutdown.

    On startup:
    1. Creates all database tables that don't exist yet
    2. Logs LAN network info if LAN_MODE is enabled

    This is fine for development with SQLite. In production with
    PostgreSQL, we'll use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)

    # ── Sprint 5: Log LAN accessibility info at startup ──
    if settings.LAN_MODE:
        from app.core.network import get_lan_ip
        lan_ip = get_lan_ip()
        logger.info("═" * 50)
        logger.info("🌐 LAN MODE ENABLED")
        logger.info(f"   Local:    http://localhost:{settings.PORT}")
        if lan_ip != "127.0.0.1":
            logger.info(f"   Network:  http://{lan_ip}:{settings.PORT}")
            logger.info(f"   Frontend: http://{lan_ip}:{settings.FRONTEND_PORT}")
        else:
            logger.info("   ⚠️  No LAN interface detected — localhost only")
        logger.info("═" * 50)

    yield  # App runs here
    # Shutdown logic would go after yield (none needed for now)


# ─── Create the FastAPI Application ─────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A personal cloud platform built from scratch",
    docs_url="/docs",       # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc at http://localhost:8000/redoc
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────
# Allow the React dev server to make API calls.
# In LAN mode, get_cors_origins() auto-adds the LAN IP-based origins
# so other devices on the network can access the API.
cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],    # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],    # Authorization, Content-Type, etc.
)

# ─── Include Routers ────────────────────────────────────
# Each router is a group of related endpoints.
# prefix="/api" means all routes start with /api
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(activity_router, prefix="/api")
app.include_router(network_router, prefix="/api")


# ─── Root Endpoint ──────────────────────────────────────
@app.get("/")
def root():
    """
    Root endpoint — just confirms the API is running.
    Not part of the actual API, just a convenience.
    """
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
