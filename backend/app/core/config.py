"""
Configuration Module
====================
Reads environment variables and provides a single Settings object
that the rest of the application imports.

WHY a Settings class instead of raw os.getenv() everywhere?
- Single source of truth: change a variable name in one place
- Type safety: Pydantic validates and casts values
- Defaults: sensible fallbacks for local development
- Testability: you can override settings in tests easily
"""

from pathlib import Path
from pydantic_settings import BaseSettings

# Absolute path to backend directory (holds .env, cloud.db, storage/)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Pydantic-settings will:
    1. Look for a .env file in the backend directory
    2. Read matching environment variables (case-insensitive)
    3. Validate types and apply defaults
    """

    # Database
    DATABASE_URL: str = "sqlite:///./cloud.db"

    # Security — JWT Authentication
    SECRET_KEY: str = "change-me-before-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    DEBUG: bool = True
    APP_VERSION: str = "0.1.0"
    APP_NAME: str = "Personalized Cloud Computing"

    # Storage — file uploads
    STORAGE_DIR: str = "storage"        # Root directory for user files
    MAX_FILE_SIZE_MB: int = 50           # Max upload size per file
    DEFAULT_QUOTA_MB: int = 1024         # Default 1 GB quota per user

    # ─── LAN Deployment (Sprint 5) ───────────────
    # HOST: "127.0.0.1" = localhost only, "0.0.0.0" = all interfaces (LAN)
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    FRONTEND_PORT: int = 5173
    # LAN_MODE: when True, auto-detects LAN IP and adds it to CORS
    LAN_MODE: bool = True

    # CORS — origins allowed to call this API
    # In development: the Vite dev server
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = str(ENV_FILE) if ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def resolved_database_url(self) -> str:
        """Resolve relative SQLite path to the backend directory."""
        if self.DATABASE_URL.startswith("sqlite:///./"):
            rel_path = self.DATABASE_URL.replace("sqlite:///./", "")
            return f"sqlite:///{BACKEND_DIR / rel_path}"
        return self.DATABASE_URL

    @property
    def resolved_storage_dir(self) -> Path:
        """Resolve storage directory path relative to backend root."""
        path = Path(self.STORAGE_DIR)
        if not path.is_absolute():
            return BACKEND_DIR / path
        return path

    def get_cors_origins(self) -> list[str]:
        """
        Build the full list of allowed CORS origins.

        In LAN mode, this dynamically adds the LAN IP-based origins
        so that devices on the same network can make API calls.
        """
        origins = list(self.CORS_ORIGINS)  # Copy the base list

        # Standard dev origins
        for extra in [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
        ]:
            if extra not in origins:
                origins.append(extra)

        if self.LAN_MODE:
            from app.core.network import get_lan_ip
            lan_ip = get_lan_ip()

            if lan_ip != "127.0.0.1":
                # Add LAN origins for frontend (multiple ports) and backend
                for port in [self.FRONTEND_PORT, self.FRONTEND_PORT + 1, 5174, 5175, self.PORT]:
                    lan_origin = f"http://{lan_ip}:{port}"
                    if lan_origin not in origins:
                        origins.append(lan_origin)

            # Also allow mDNS hostname (.local) for Apple/Bonjour mobile devices
            try:
                import socket
                hostname = socket.gethostname()
                if hostname:
                    for port in [self.FRONTEND_PORT, 5174, self.PORT]:
                        local_origin = f"http://{hostname}.local:{port}"
                        if local_origin not in origins:
                            origins.append(local_origin)
            except Exception:
                pass

        return origins


# Create a single instance that gets imported everywhere
# Usage: from app.core.config import settings
settings = Settings()
