# ☁️ Personalized Cloud Computing

A personal cloud platform built from scratch — starting with cloud storage and evolving into a full-featured cloud environment.

**B.Tech Final Year Project**

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
| Auth       | JWT (coming in Sprint 2)           |
| Storage    | Local filesystem → MinIO (future)  |
| AI         | Ollama + Qwen/Llama (future)       |

---

## 📦 Project Structure

```
Personalized-Cloud-Computing/
├── backend/             # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── core/        # Config, settings
│   │   ├── database/    # DB engine, session
│   │   ├── models/      # SQLAlchemy models (Sprint 2+)
│   │   ├── schemas/     # Pydantic schemas (Sprint 2+)
│   │   ├── services/    # Business logic (Sprint 2+)
│   │   └── main.py      # App entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # React + Vite application
│   ├── src/
│   └── package.json
├── docs/                # Project documentation
├── docker/              # Docker configs (Sprint 5+)
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

- [x] **Sprint 1** — Foundation (project structure, health check, frontend ↔ backend)
- [ ] **Sprint 2** — Authentication (register, login, JWT, protected routes)
- [ ] **Sprint 3** — Personal Cloud Storage (upload, download, folders)
- [ ] **Sprint 4** — Cloud Dashboard (stats, recent files, profile)
- [ ] **Sprint 5** — Docker Infrastructure
- [ ] **Sprint 6** — Cloud Services (app deployment, monitoring)
- [ ] **Sprint 7** — AI Assistant (Ollama + local LLM)
- [ ] **Sprint 8** — Advanced Features (backup, sharing, RBAC)

---

## 📝 License

This project is part of an academic curriculum and is for educational purposes.