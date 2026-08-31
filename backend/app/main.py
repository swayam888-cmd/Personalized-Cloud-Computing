"""
FastAPI Application Entry Point
================================
This is the file that creates and configures the entire backend application.

WHAT HAPPENS WHEN THE SERVER STARTS:
1. FastAPI() creates the application object
2. CORS middleware is added (so the browser allows frontend → backend calls)
3. API routers are included (each router is a group of related endpoints)
4. Uvicorn (the ASGI server) serves this app on http://localhost:8000

KEY CONCEPT — CORS (Cross-Origin Resource Sharing):
When your React app at localhost:5173 tries to call the API at localhost:8000,
the browser blocks it by default (it's a "cross-origin" request — different port).
CORS middleware tells the browser: "Yes, localhost:5173 is allowed to call me."
Without CORS, the frontend fetch() calls would fail with a cryptic error.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router

# ─── Create the FastAPI Application ─────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A personal cloud platform built from scratch",
    docs_url="/docs",       # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc",     # ReDoc at http://localhost:8000/redoc
)

# ─── CORS Middleware ─────────────────────────────────────
# Allow the React dev server to make API calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],    # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],    # Authorization, Content-Type, etc.
)

# ─── Include Routers ────────────────────────────────────
# Each router is a group of related endpoints.
# prefix="/api" means all routes start with /api
# So health_router's "/health" becomes "/api/health"
app.include_router(health_router, prefix="/api")


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
