"""
Users API Routes
================
Endpoints for viewing and managing user profiles.

Currently just GET /users/me — the "who am I?" endpoint.
This is a PROTECTED route: it requires a valid JWT token.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.services import auth as auth_service
from app.services import activity as activity_service

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


@router.put("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the current authenticated user's profile fields (username, email).

    Protected route: Users cannot modify id, role, password, quota, or is_active.
    Validates uniqueness of email and username.
    Logs UPDATE_PROFILE activity.
    """
    updated = False

    if update_data.email is not None and update_data.email != user.email:
        existing_email = (
            db.query(User)
            .filter(User.email == update_data.email, User.id != user.id)
            .first()
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered to another account",
            )
        user.email = update_data.email
        updated = True

    if update_data.username is not None and update_data.username != user.username:
        existing_username = (
            db.query(User)
            .filter(User.username == update_data.username, User.id != user.id)
            .first()
        )
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )
        user.username = update_data.username
        updated = True

    if updated:
        db.commit()
        db.refresh(user)
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="UPDATE_PROFILE",
            item_name="Profile",
            details=f"Updated profile (username: {user.username})",
        )

    return user


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Change password for the current authenticated user.

    Verifies current password with bcrypt, validates and hashes the new password,
    and logs the CHANGE_PASSWORD activity (never storing/logging plaintext passwords).
    """
    if not auth_service.verify_password(data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    user.hashed_password = auth_service.hash_password(data.new_password)
    db.commit()

    activity_service.log_activity(
        db=db,
        user_id=user.id,
        action="CHANGE_PASSWORD",
        item_name="Security",
        details="Password was changed successfully",
    )

    return {"message": "Password changed successfully"}
