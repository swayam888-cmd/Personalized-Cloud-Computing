"""
Authentication Service
======================
All authentication business logic lives here — NOT in the API routes.

WHY SEPARATE SERVICES FROM ROUTES?
Routes handle HTTP concerns (request parsing, status codes, headers).
Services handle BUSINESS LOGIC (password hashing, token creation, user lookup).

This separation means:
1. Routes stay thin and readable
2. Business logic is testable without HTTP
3. Multiple routes can reuse the same logic

HOW PASSWORD HASHING WORKS (bcrypt):
- bcrypt is a one-way hash function designed for passwords
- It's intentionally SLOW (to make brute-force attacks impractical)
- It includes a random "salt" so identical passwords produce different hashes
- Example: "mypassword" → "$2b$12$LJ3m4ys..." (different every time!)

HOW JWT WORKS:
- A JWT is a signed JSON object: { "sub": 5, "exp": 1693000000 }
- "sub" (subject) = user ID
- "exp" (expiration) = when the token expires
- The server signs it with SECRET_KEY — anyone can READ the data,
  but only the server can VERIFY it wasn't tampered with
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate


# ═══════════════════════════════════════════════════════════
# Password Hashing
# ═══════════════════════════════════════════════════════════

def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    bcrypt automatically generates a random salt and includes it
    in the output, so we don't need to store the salt separately.

    Args:
        plain_password: The user's plain-text password

    Returns:
        A bcrypt hash string like "$2b$12$..."
    """
    password_bytes = plain_password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain-text password matches a bcrypt hash.

    This is used during login: the user sends their password,
    we hash it and compare with what's stored in the database.

    Args:
        plain_password: What the user typed
        hashed_password: What we stored in the database

    Returns:
        True if the password matches, False otherwise
    """
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ═══════════════════════════════════════════════════════════
# JWT Token Management
# ═══════════════════════════════════════════════════════════

def create_access_token(data: dict) -> str:
    """
    Create a signed JWT access token.

    The token contains:
    - 'sub' (subject): the user's ID
    - 'exp' (expiration): when the token becomes invalid

    Args:
        data: Dictionary with claims to encode (e.g., {"sub": 5})

    Returns:
        A signed JWT string
    """
    to_encode = data.copy()

    # Set expiration time
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode["exp"] = expire

    # Sign and return the token
    token = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token


def verify_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.

    If the token is valid and not expired, returns the decoded payload.
    If anything is wrong (expired, tampered, invalid), returns None.

    Args:
        token: The JWT string from the Authorization header

    Returns:
        Decoded payload dict or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


# ═══════════════════════════════════════════════════════════
# User Operations
# ═══════════════════════════════════════════════════════════

def get_user_by_email(db: Session, email: str) -> User | None:
    """Look up a user by their email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    """Look up a user by their username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Look up a user by their ID."""
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Register a new user.

    Steps:
    1. Check if email already exists → raise error
    2. Check if username already exists → raise error
    3. Hash the password
    4. Create the User record
    5. Save to database

    Args:
        db: Database session
        user_data: Validated registration data (email, username, password)

    Returns:
        The newly created User object

    Raises:
        ValueError: If email or username is already taken
    """
    # Check for duplicate email
    if get_user_by_email(db, user_data.email):
        raise ValueError("A user with this email already exists")

    # Check for duplicate username
    if get_user_by_username(db, user_data.username):
        raise ValueError("This username is already taken")

    # Create the user with a hashed password
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        role="user",  # Default role
    )

    db.add(user)
    db.commit()
    db.refresh(user)  # Reload from DB to get the auto-generated ID

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Verify login credentials.

    Steps:
    1. Find the user by email
    2. Check if the password matches
    3. Check if the account is active

    Args:
        db: Database session
        email: The user's email
        password: The plain-text password to verify

    Returns:
        The User object if credentials are valid, None otherwise
    """
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    if not user.is_active:
        return None

    return user
