# Architecture Overview

## System Architecture

```
┌──────────────────────────────┐
│        Browser (Client)       │
│    React + Vite + Tailwind    │
│       localhost:5173          │
└──────────────┬───────────────┘
               │ HTTP (JSON + multipart)
               │ CORS enabled
               ▼
┌──────────────────────────────┐
│       FastAPI Backend         │
│       localhost:8000          │
│                               │
│  ┌─────────┐ ┌────────────┐  │
│  │   API    │ │   Core     │  │
│  │ Routes   │ │  Config    │  │
│  └────┬─────┘ │  Security  │  │
│       │       └────────────┘  │
│  ┌────▼─────┐                 │
│  │ Services  │                │
│  │ (logic)   │                │
│  └──┬────┬───┘                │
│     │    │                    │
│  ┌──▼──┐ ┌▼────────────────┐ │
│  │ DB   │ │  File Storage   │ │
│  │SQLite│ │ storage/<uid>/  │ │
│  └──────┘ └─────────────────┘ │
└──────────────────────────────┘
```

## Directory Structure

```
Personalized-Cloud-Computing/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            ← FastAPI app entry point
│   │   ├── api/               ← Route handlers (controllers)
│   │   │   ├── __init__.py
│   │   │   └── health.py      ← GET /api/health
│   │   ├── core/              ← Application config
│   │   │   ├── __init__.py
│   │   │   └── config.py      ← Settings from .env
│   │   ├── database/          ← Database engine & session
│   │   │   ├── __init__.py
│   │   │   └── session.py     ← SQLAlchemy setup
│   │   ├── models/            ← SQLAlchemy models (Sprint 2+)
│   │   ├── schemas/           ← Pydantic request/response schemas (Sprint 2+)
│   │   └── services/          ← Business logic (Sprint 2+)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx           ← React entry point
│   │   ├── App.jsx            ← Root component
│   │   └── index.css          ← Tailwind + theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   └── architecture.md        ← This file
├── docker/                     ← Docker configs (Sprint 5+)
├── .gitignore
└── README.md
```

## Layered Architecture

The backend follows a strict layering pattern:

| Layer     | Directory  | Responsibility                    | Depends On       |
|-----------|------------|-----------------------------------|------------------|
| API       | `api/`     | HTTP endpoints, request parsing   | Services         |
| Services  | `services/`| Business logic, validation        | Database/Storage |
| Database  | `database/`| Connection management, queries    | SQLAlchemy       |
| Models    | `models/`  | Table definitions                 | SQLAlchemy       |
| Schemas   | `schemas/` | Request/response validation       | Pydantic         |
| Core      | `core/`    | Config, settings, constants       | Environment      |

**Rule**: Each layer only calls the layer below it. The API layer never touches the database directly — it calls a service, which calls the database.

## Request Flow Example

```
Browser → GET /api/health
       → FastAPI Router → health_check()
       → check_database_connection()
       → SQLAlchemy → SELECT 1
       ← { status: "healthy", database: "connected" }
       ← JSON Response → Browser
```

## Technology Choices

| Choice          | Why                                                      |
|-----------------|----------------------------------------------------------|
| FastAPI         | Modern Python, async support, auto-generated docs        |
| SQLAlchemy      | Most popular Python ORM, supports all major databases    |
| SQLite (dev)    | Zero setup, file-based, perfect for development          |
| PostgreSQL (prod)| Production-grade, scales well, industry standard        |
| React           | Component-based UI, large ecosystem                     |
| Vite            | Fast dev server, instant hot reload                      |
| Tailwind CSS v4 | Utility-first CSS, CSS-first config, no build step       |

## Future Evolution

The modular structure is designed for incremental growth:

- **Sprint 2**: Add `models/user.py`, `schemas/user.py`, `services/auth.py`, `api/auth.py`
- **Sprint 3**: Add `services/storage.py`, `api/files.py`, storage backends
- **Sprint 5**: Add `docker/` with Compose files
- **Sprint 7**: Add `services/ai.py` with Ollama integration
