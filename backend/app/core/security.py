"""
Security Dependencies
=====================
FastAPI dependencies for authentication and authorization.

HOW PROTECTED ROUTES WORK:

1. The client sends a request with a JWT token:
   GET /api/users/me
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. FastAPI sees that the route needs 'get_current_user':
   @router.get("/me")
   def read_me(user: User = Depends(get_current_user)):

3. get_current_user runs BEFORE the route:
   - Extracts the token from the Authorization header
   - Decodes and verifies the JWT signature
   - Looks up the user in the database
   - Returns the User object (or raises 401 Unauthorized)

4. The route receives the authenticated user and can safely use it.

WHY OAuth2PasswordBearer?
- It's a FastAPI helper that:
  a) Reads the Authorization header
  b) Strips "Bearer " prefix
  c) Returns just the token string
  d) Adds the lock icon to Swagger docs (try it out!)
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.auth import verify_token, get_user_by_id
from app.models.user import User

# This tells FastAPI WHERE to find the token.
# tokenUrl is the LOGIN endpoint path (used by Swagger's "Authorize" button).
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: extracts and validates the current user from a JWT.

    This is used by ANY route that requires authentication:

        @router.get("/protected")
        def protected_route(user: User = Depends(get_current_user)):
            return {"message": f"Hello, {user.username}!"}

    If the token is missing, expired, or invalid, this raises a
    401 Unauthorized error — the route code never executes.
    """
    # Define the error we'll raise if anything goes wrong
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the JWT
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    # Extract the user ID from the token's "sub" claim
    # (stored as string in JWT, convert back to int)
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise credentials_exception

    # Look up the user in the database
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    # Check if the account is still active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    return user


def get_current_admin(
    user: User = Depends(get_current_user),
) -> User:
    """
    FastAPI dependency: ensures the current user is an admin.

    Use this for admin-only routes:

        @router.get("/admin/users")
        def list_users(admin: User = Depends(get_current_admin)):
            ...

    If the user is authenticated but not an admin, raises 403 Forbidden.
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
