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

    # CORS — origins allowed to call this API
    # In development: the Vite dev server
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create a single instance that gets imported everywhere
# Usage: from app.core.config import settings
settings = Settings()
