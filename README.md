# ☁️ Personalized Cloud Infrastructure for Secure Data Storage and Management

A self-hosted personal cloud platform built from scratch — starting with cloud storage and evolving into a full-featured, containerized private cloud environment accessible across your local network.

**B.Tech Major Project**

---

## 🏗️ Architecture

```
Browser Clients (Localhost & LAN Devices)
       ↓ HTTP / REST / Multipart Form Data
FastAPI Backend (0.0.0.0:8000)
       ↓ SQLAlchemy ORM
Database (SQLite → PostgreSQL) & Isolated Storage (storage/<user_id>/)
```

See [docs/architecture.md](docs/architecture.md) for full architectural documentation.  
See [docs/lan-setup.md](docs/lan-setup.md) for LAN multi-device access setup.

---

## 🛠️ Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS v4, Lucide Icons |
| Backend    | Python 3.10+, FastAPI, SQLAlchemy, Pydantic   |
| Database   | SQLite (dev) → PostgreSQL (prod)              |
| Auth       | JWT (Bearer tokens) + Bcrypt password hashing |
| Storage    | User-isolated filesystem (UUID-keyed) → MinIO |
| Networking | LAN interface auto-detection, dynamic CORS    |
| Monitoring | psutil system metrics (Sprint 6+)             |
| Containers | Docker, Docker Compose (Sprint 9+)            |
| AI         | Ollama + Local LLM (Sprint 12)                |

---

## 📦 Project Structure

```
Personalized-Cloud-Computing/
├── backend/             # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers (auth, files, activity, network)
│   │   ├── core/        # Config, security, networking utilities
│   │   ├── database/    # DB engine, session setup
│   │   ├── models/      # SQLAlchemy models (User, File, ActivityLog)
│   │   ├── schemas/     # Pydantic validation schemas
│   │   ├── services/    # Business logic & file management
│   │   └── main.py      # App entry point, lifecycle & CORS
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── api/         # Dynamic API client & endpoint modules
│   │   ├── components/  # Reusable widgets (Storage, Activity, Network)
│   │   ├── pages/       # Dashboard, Files, Login, Register
│   │   └── index.css    # Tailwind CSS v4 design system
│   ├── vite.config.js   # Dev server configured for 0.0.0.0 binding
│   └── package.json
├── docs/                # Project documentation
│   ├── architecture.md  # Architecture design & system layers
│   └── lan-setup.md     # Multi-device LAN deployment guide
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
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Run the server (default localhost or LAN mode)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Visit **http://localhost:8000/api/health** or **http://localhost:8000/api/network/info** to verify.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit **http://localhost:5173** to access the application.

---

## 🌐 LAN Multi-Device Access

To access your cloud storage from smartphones, tablets, or other computers on your Wi-Fi network:

1. In `backend/.env`, ensure:
   ```env
   HOST=0.0.0.0
   LAN_MODE=true
   ```
2. Start both backend and frontend servers.
3. Check the server console or dashboard **Network Status Widget** for your LAN IP (e.g., `192.168.1.42`).
4. On your other device, navigate to:
   ```
   http://<YOUR_LAN_IP>:5173
   ```
5. Log in or create an account to start managing files across devices.

For complete firewall, router, and troubleshooting instructions, see [docs/lan-setup.md](docs/lan-setup.md).

---

## 🗺️ Development Roadmap

- [x] **Sprint 1** — Project Foundation (project structure, health check, frontend ↔ backend)
- [x] **Sprint 2** — Authentication & User Access (register, login, JWT, protected routes)
- [x] **Sprint 3** — Personal Cloud Storage (upload, download, folders, quota, UUID storage)
- [x] **Sprint 4** — Cloud Dashboard & Activity (analytics, recent files, profile, activity logs)
- [x] **Sprint 5** — LAN Private Cloud Deployment (multi-device access, LAN IP detection, network status widget)
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