"""
Database Session Module
=======================
Creates the SQLAlchemy engine and session factory.

KEY CONCEPTS:
- Engine: the connection to the database (like a connection pool)
- SessionLocal: a factory that creates new database sessions
- get_db(): a FastAPI "dependency" that gives each request its own session
  and automatically closes it when the request is done

WHY a dependency?
FastAPI's dependency injection lets us write:

    @router.get("/something")
    def read_something(db: Session = Depends(get_db)):
        ...

FastAPI will:
1. Call get_db() before the route runs → creates a session
2. Pass the session to the route function
3. After the route returns (or raises), close the session

This means we never forget to close a database connection.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# ─── Engine ──────────────────────────────────────────────
# The engine manages the actual database connection(s).
# connect_args={"check_same_thread": False} is only needed for SQLite
# because SQLite doesn't allow multiple threads to use the same connection.
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

# ─── Session Factory ────────────────────────────────────
# Each call to SessionLocal() creates a new session (a "conversation" with the DB).
# autocommit=False: we control when to commit
# autoflush=False: we control when to flush (write pending changes to DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Base Class ──────────────────────────────────────────
# All our database models (User, File, etc.) will inherit from this.
# It gives them the ability to map Python classes to database tables.
Base = declarative_base()


# ─── Dependency ──────────────────────────────────────────
def get_db():
    """
    FastAPI dependency that provides a database session.

    Usage in a route:
        def my_route(db: Session = Depends(get_db)):
            db.query(...)

    The 'yield' keyword makes this a generator-based dependency:
    - Code before yield runs BEFORE the route
    - Code after yield runs AFTER the route (cleanup)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """
    Test if we can actually reach the database.
    Returns True if connected, False otherwise.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
