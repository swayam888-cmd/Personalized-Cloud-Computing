"""
Admin Bootstrap and Management CLI
==================================
Command-line tool to manage administrative privileges, list accounts,
promote/demote users, and bootstrap initial administrator accounts.

Usage:
    python -m app.core.admin_cli list
    python -m app.core.admin_cli promote <username_or_email>
    python -m app.core.admin_cli demote <username_or_email>
    python -m app.core.admin_cli create --username admin --email admin@example.com --password secret
"""

import argparse
import sys

from app.database.session import SessionLocal
from app.models import User
from app.services.auth import hash_password


def list_users():
    """Display all registered users with their roles and status."""
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id.asc()).all()
        print(f"\nTotal users registered: {len(users)}")
        print("-" * 75)
        print(f"{'ID':<4} | {'Role':<6} | {'Status':<9} | {'Username':<22} | {'Email':<25}")
        print("-" * 75)
        for u in users:
            status_str = "Active" if u.is_active else "Suspended"
            role_str = u.role.upper()
            print(f"{u.id:<4} | {role_str:<6} | {status_str:<9} | {u.username:<22} | {u.email:<25}")
        print("-" * 75 + "\n")
    finally:
        db.close()


def set_user_role(identifier: str, role: str):
    """Promote or demote a user by username or email."""
    if role not in ("user", "admin"):
        print(f"Error: Invalid role '{role}'. Must be 'user' or 'admin'.")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = db.query(User).filter(
            (User.username == identifier) | (User.email == identifier)
        ).first()

        if not user:
            print(f"Error: User '{identifier}' not found in the database.")
            sys.exit(1)

        user.role = role
        db.commit()
        db.refresh(user)
        print(f"Successfully updated {user.username} ({user.email}) to role: {user.role.upper()}")
    finally:
        db.close()


def create_admin(username: str, email: str, password: str):
    """Create a new administrator account directly."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()

        if existing:
            print(f"Error: User with username '{username}' or email '{email}' already exists.")
            sys.exit(1)

        new_user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Successfully created admin account: ID={new_user.id}, username={new_user.username}, email={new_user.email}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Personalized Cloud Administration Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # list
    subparsers.add_parser("list", help="List all registered accounts")

    # promote
    promote_parser = subparsers.add_parser("promote", help="Promote a user to admin")
    promote_parser.add_argument("identifier", help="Username or email address")

    # demote
    demote_parser = subparsers.add_parser("demote", help="Demote an admin to standard user")
    demote_parser.add_argument("identifier", help="Username or email address")

    # create
    create_parser = subparsers.add_parser("create", help="Create a new administrator account")
    create_parser.add_argument("--username", required=True, help="Admin username")
    create_parser.add_argument("--email", required=True, help="Admin email")
    create_parser.add_argument("--password", required=True, help="Admin password")

    args = parser.parse_args()

    if args.command == "list":
        list_users()
    elif args.command == "promote":
        set_user_role(args.identifier, "admin")
    elif args.command == "demote":
        set_user_role(args.identifier, "user")
    elif args.command == "create":
        create_admin(args.username, args.email, args.password)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
