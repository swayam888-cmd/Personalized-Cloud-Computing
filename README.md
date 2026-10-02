# ☁️ Personalized Cloud Infrastructure for Secure Data Storage and Management

A self-hosted personal cloud platform built from scratch — starting with cloud storage and evolving into a full-featured, containerized private cloud environment.

**B.Tech Major Project**

---

## 🏗️ Architecture

```
Browser (React + Vite)
       ↓ HTTP
FastAPI Backend
       ↓ SQLAlchemy
Database (SQLite → PostgreSQL)
```

See [docs/architecture.md](docs/architecture.md) for details.

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React, Vite, Tailwind CSS v4      |
| Backend    | Python, FastAPI, SQLAlchemy        |
| Database   | SQLite (dev) → PostgreSQL (prod)   |
| Auth       | JWT (Bearer tokens) + Bcrypt      |
| Storage    | Local filesystem → MinIO (future)  |
| Monitoring | psutil (Sprint 6+)                |
| Containers | Docker, Docker Compose (Sprint 9+)|
| AI         | Ollama + Local LLM (Sprint 12)    |

---

## 📦 Project Structure

```
Personalized-Cloud-Computing/
├── backend/             # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── core/        # Config, security
│   │   ├── database/    # DB engine, session
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── main.py      # App entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # React + Vite application
│   ├── src/
│   └── package.json
├── docs/                # Project documentation
├── docker/              # Docker configs (Sprint 9+)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

Visit **http://localhost:8000/api/health** to verify.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit **http://localhost:5173** to see the app.

---

## 🗺️ Development Roadmap

- [x] **Sprint 1** — Project Foundation (project structure, health check, frontend ↔ backend)
- [x] **Sprint 2** — Authentication & User Access (register, login, JWT, protected routes)
- [x] **Sprint 3** — Personal Cloud Storage (upload, download, folders, quota, UUID storage)
- [x] **Sprint 4** — Cloud Dashboard & Activity (analytics, recent files, profile, activity logs)
- [ ] **Sprint 5** — LAN Private Cloud Deployment (multi-device access, LAN IP configuration)
- [ ] **Sprint 6** — Administration & Resource Monitoring (admin dashboard, user mgmt, psutil)
- [ ] **Sprint 7** — File Sharing & Collaboration (share links, expiration, passwords)
- [ ] **Sprint 8** — PostgreSQL & Database Migrations (PostgreSQL driver, Alembic migrations)
- [ ] **Sprint 9** — Docker & Containerized Infrastructure (Dockerfiles, Docker Compose)
- [ ] **Sprint 10** — Cloud Infrastructure Services (MinIO object storage, backups, health monitoring)
- [ ] **Sprint 11** — Testing & Security Hardening (test suites, rate limiting, security headers)
- [ ] **Sprint 12** — Optional Local AI Assistant (Ollama, local LLM document assistance)

---

## 📝 License

This project is part of an academic curriculum and is for educational purposes.