"""
Users API Routes
================
Endpoints for viewing and managing user profiles.

Currently just GET /users/me — the "who am I?" endpoint.
This is a PROTECTED route: it requires a valid JWT token.
"""

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def read_current_user(user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's profile.

    This route is PROTECTED — it requires a valid JWT token
    in the Authorization header:

        Authorization: Bearer eyJhbGciOiJIUzI1...

    If the token is missing or invalid, FastAPI returns 401.
    If the token is valid, this returns the user's profile.

    The 'user' parameter is injected by the get_current_user dependency.
    We don't have to manually parse the token — FastAPI does it for us.
    """
    return user
