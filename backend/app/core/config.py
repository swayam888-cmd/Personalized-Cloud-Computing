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

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Pydantic-settings will:
    1. Look for a .env file in the current working directory
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
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_PORT: int = 5173
    # LAN_MODE: when True, auto-detects LAN IP and adds it to CORS
    LAN_MODE: bool = False

    # CORS — origins allowed to call this API
    # In development: the Vite dev server
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_cors_origins(self) -> list[str]:
        """
        Build the full list of allowed CORS origins.

        In LAN mode, this dynamically adds the LAN IP-based origins
        so that devices on the same network can make API calls.

        WHY DYNAMIC?
        The machine's LAN IP can change (DHCP). Hardcoding it in .env
        would break whenever the router assigns a new IP. By detecting
        it at startup, we always have the correct origin.
        """
        origins = list(self.CORS_ORIGINS)  # Copy the base list

        if self.LAN_MODE:
            from app.core.network import get_lan_ip
            lan_ip = get_lan_ip()

            if lan_ip != "127.0.0.1":
                # Add LAN origins for both frontend and backend ports
                lan_frontend = f"http://{lan_ip}:{self.FRONTEND_PORT}"
                lan_backend = f"http://{lan_ip}:{self.PORT}"

                if lan_frontend not in origins:
                    origins.append(lan_frontend)
                if lan_backend not in origins:
                    origins.append(lan_backend)

        return origins


# Create a single instance that gets imported everywhere
# Usage: from app.core.config import settings
settings = Settings()
