"""
User Schemas (Pydantic)
=======================
Schemas define the SHAPE of data going into and out of the API.

WHY SEPARATE SCHEMAS FROM MODELS?
- Models define what's in the DATABASE (all columns, including hashed_password)
- Schemas define what the API ACCEPTS and RETURNS (never expose hashed_password!)

Think of it this way:
- Model = "what we store"
- Schema = "what we show"

PYDANTIC VALIDATION:
Pydantic automatically validates incoming data. If someone sends a request
with a missing 'email' field or an email that's not a valid format,
Pydantic returns a 422 error BEFORE our code even runs.

EXAMPLE:
    # This will fail validation (password too short):
    UserCreate(email="a@b.com", username="a", password="12")
    # → ValidationError: password must be at least 6 characters
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ─── Registration ────────────────────────────────────────
class UserCreate(BaseModel):
    """
    What the client sends when registering a new account.

    POST /api/auth/register
    Body: { "email": "...", "username": "...", "password": "..." }
    """

    email: EmailStr  # Pydantic validates email format automatically
    username: str = Field(
        ...,                    # Required field (no default)
        min_length=3,           # At least 3 characters
        max_length=50,          # At most 50 characters
        pattern=r"^[a-zA-Z0-9_]+$",  # Only letters, numbers, underscores
    )
    password: str = Field(
        ...,
        min_length=6,           # Enforce minimum password length
        max_length=100,
    )


# ─── Login ───────────────────────────────────────────────
class UserLogin(BaseModel):
    """
    What the client sends when logging in.

    POST /api/auth/login
    Body: { "email": "...", "password": "..." }
    """

    email: EmailStr
    password: str


# ─── Response ────────────────────────────────────────────
class UserResponse(BaseModel):
    """
    What the API returns when showing user info.
    NEVER includes the password or hashed_password.

    This uses 'model_config' with from_attributes=True so that Pydantic
    can read data directly from a SQLAlchemy model object.
    """

    id: int
    email: str
    username: str
    is_active: bool
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Profile Update (Sprint 4) ───────────────────────────
class UserUpdate(BaseModel):
    """
    What the client sends when updating their profile.

    PUT /api/users/me
    Body: { "username": "new_name", "email": "new@example.com" }
    """

    email: EmailStr | None = None
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$",
    )


# ─── Token ───────────────────────────────────────────────
class Token(BaseModel):
    """
    The JWT token returned after successful login.

    The client stores this and sends it in the Authorization header:
    Authorization: Bearer <access_token>
    """

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    The data encoded INSIDE the JWT token.
    When we decode a token, this is what we extract.
    """

    user_id: int | None = None
