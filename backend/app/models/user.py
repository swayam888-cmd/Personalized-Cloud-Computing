"""
User Model
==========
Defines the 'users' table in the database.

HOW SQLALCHEMY MODELS WORK:
- Each class that inherits from Base becomes a database table
- Each class attribute with Column() becomes a column in that table
- SQLAlchemy automatically handles the mapping between Python objects
  and database rows

SECURITY NOTES:
- We store 'hashed_password', NEVER the plain-text password
- The 'email' column is unique — no two users can share an email
- The 'is_active' flag lets us disable accounts without deleting data
- The 'role' field enables future admin vs. regular user permissions

EXAMPLE:
    # Creating a user (in a service, never in an API route directly)
    user = User(
        email="alice@example.com",
        username="alice",
        hashed_password="$2b$12$...",  # bcrypt hash
        role="user",
    )
    db.add(user)
    db.commit()
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime

from app.database.session import Base


class User(Base):
    """
    The users table.

    Every person who registers on the platform gets one row in this table.
    This is the foundation for all per-user features (files, storage, etc.).
    """

    __tablename__ = "users"

    # ─── Primary Key ─────────────────────────────────────
    # Auto-incrementing integer. Every user gets a unique ID.
    id = Column(Integer, primary_key=True, index=True)

    # ─── Identity ────────────────────────────────────────
    # Email is used for login (unique, indexed for fast lookups)
    email = Column(String, unique=True, index=True, nullable=False)

    # Username is the display name (unique, shown in the UI)
    username = Column(String, unique=True, index=True, nullable=False)

    # ─── Security ────────────────────────────────────────
    # This is the bcrypt hash of the password, NOT the password itself
    hashed_password = Column(String, nullable=False)

    # ─── Account State ───────────────────────────────────
    # Can deactivate accounts without deleting them
    is_active = Column(Boolean, default=True)

    # Role: "user" or "admin" — for future access control
    role = Column(String, default="user")

    # ─── Timestamps ──────────────────────────────────────
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
