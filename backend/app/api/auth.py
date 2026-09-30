"""
Authentication API Routes
=========================
Handles user registration and login.

These routes are the HTTP "entry points" — they parse the request,
call the appropriate service function, and return a response.

IMPORTANT: No business logic here! The routes just:
1. Receive the request data (validated by Pydantic)
2. Call a service function
3. Return the result or an error
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth import register_user, authenticate_user, create_access_token
from app.services import activity as activity_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.

    Expects:
        {
            "email": "alice@example.com",
            "username": "alice",
            "password": "securepass123"
        }

    Returns:
        The created user (without password).

    Errors:
        400 — Email or username already taken
        422 — Invalid input (Pydantic validation)
    """
    try:
        user = register_user(db, user_data)
        activity_service.log_activity(
            db=db,
            user_id=user.id,
            action="REGISTER",
            item_name=None,
            details=f"Account created for user '{user.username}'",
        )
    except ValueError as e:
        # register_user raises ValueError for duplicate email/username
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Log in and receive a JWT access token.

    Expects:
        {
            "email": "alice@example.com",
            "password": "securepass123"
        }

    Returns:
        {
            "access_token": "eyJhbGciOiJIUzI1...",
            "token_type": "bearer"
        }

    Errors:
        401 — Invalid email or password
    """
    user = authenticate_user(db, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create a JWT token with the user's ID as the "subject"
    access_token = create_access_token(data={"sub": str(user.id)})

    activity_service.log_activity(
        db=db,
        user_id=user.id,
        action="LOGIN",
        item_name=None,
        details=f"User '{user.username}' logged in",
    )

    return Token(access_token=access_token)
