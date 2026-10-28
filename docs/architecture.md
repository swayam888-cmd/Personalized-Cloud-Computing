# Architecture Overview

## System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                   Local Area Network                    │
                                  │                  (Wi-Fi / Ethernet LAN)                 │
                                  └───────────┬─────────────────────────────────┬───────────┘
                                              │                                 │
                                              ▼                                 ▼
                                    ┌───────────────────┐             ┌───────────────────┐
                                    │    Host Machine   │             │   Remote Client   │
                                    │  localhost:5173   │             │ Mobile / Laptop   │
                                    │  localhost:8000   │             │ 192.168.1.x:5173  │
                                    └─────────┬─────────┘             └─────────┬─────────┘
                                              │                                 │
                                              │  HTTP (REST + JWT + Multipart)  │
                                              └────────────────┬────────────────┘
                                                               │ CORS Enabled (LAN Mode)
                                                               ▼
                                    ┌─────────────────────────────────────────────────────┐
                                    │                   FastAPI Backend                   │
                                    │                  0.0.0.0:8000 (LAN)                 │
                                    │                                                     │
                                    │   ┌──────────────────────────────────────────────┐  │
                                    │   │                  API Layer                   │  │
                                    │   │  /health · /auth · /files · /activity · /net │  │
                                    │   └──────────────────────┬───────────────────────┘  │
                                    │                          │                          │
                                    │   ┌──────────────────────▼───────────────────────┐  │
                                    │   │                Services Layer                │  │
                                    │   │  AuthService · FileService · ActivityService │  │
                                    │   │  NetworkService · QuotaService               │  │
                                    │   └──────────────┬───────────────────────────────┘  │
                                    │                  │                                  │
                                    │   ┌──────────────┴───────────────┐                  │
                                    │   │                              │                  │
                                    │   ▼                              ▼                  │
                                    │ ┌─────────────────┐    ┌──────────────────────────┐ │
                                    │ │ Database Layer  │    │  Isolated Storage Layer  │ │
                                    │ │ SQLAlchemy ORM  │    │  storage/<user_id>/...   │ │
                                    │ │ (SQLite / PG)   │    │  (UUID on Disk + Metadata│ │
                                    │ └─────────────────┘    └──────────────────────────┘ │
                                    └─────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
Personalized-Cloud-Computing/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            ← FastAPI app entry point, lifecycle & CORS setup
│   │   ├── api/               ← Route handlers (controllers)
│   │   │   ├── __init__.py
│   │   │   ├── health.py      ← GET /api/health
│   │   │   ├── auth.py        ← POST /register, /login, /me, /password, PUT /profile
│   │   │   ├── files.py       ← POST /upload, /folder, GET /list, /download, DELETE
│   │   │   ├── activity.py    ← GET /api/activity/feed, /stats, /storage-categories
│   │   │   ├── network.py     ← GET /api/network/info (Sprint 5)
│   │   │   └── admin.py       ← GET /metrics, /users, PUT /quota, PATCH /status, /role (Sprint 6)
│   │   ├── core/              ← Application configuration & utilities
│   │   │   ├── __init__.py
│   │   │   ├── config.py      ← Pydantic settings, dynamic CORS origins
│   │   │   ├── security.py    ← Bcrypt password hashing, JWT & require_admin guard
│   │   │   ├── network.py     ← Socket-based LAN IP auto-detection (Sprint 5)
│   │   │   └── admin_cli.py   ← Admin bootstrap & account promotion CLI (Sprint 6)
│   │   ├── database/          ← Database engine & session
│   │   │   ├── __init__.py
│   │   │   └── session.py     ← SQLAlchemy sessionmaker & Base
│   │   ├── models/            ← SQLAlchemy database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py        ← User account, roles & quota tracking
│   │   │   ├── file.py        ← File and folder metadata, parent hierarchy
│   │   │   └── activity.py    ← Audit logging & user action records (Sprint 4)
│   │   ├── schemas/           ← Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py        ← User schemas, login/register validation
│   │   │   ├── file.py        ← File/folder schemas, quota responses
│   │   │   ├── activity.py    ← Activity feed, stats, category breakdown
│   │   │   ├── network.py     ← Network info response schema
│   │   │   └── admin.py       ← System metrics & user admin schemas (Sprint 6)
│   │   └── services/          ← Business logic & storage management
│   │       ├── __init__.py
│   │       ├── auth.py        ← Authentication & profile service
│   │       ├── file.py        ← File storage, UUID hashing, folder recursion
│   │       ├── activity.py    ← Audit log generation & analytics queries
│   │       ├── system.py      ← Real-time host telemetry via psutil (Sprint 6)
│   │       └── admin.py       ← User directory, quotas & account suspension (Sprint 6)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/               ← Frontend API client modules
│   │   │   ├── client.js      ← Dynamic Axios base URL resolution (LAN aware)
│   │   │   ├── auth.js        ← Auth API calls & token handling
│   │   │   ├── files.js       ← File upload/download/folder API
│   │   │   ├── activity.js    ← Activity log & analytics API
│   │   │   ├── network.js     ← Network info API (Sprint 5)
│   │   │   └── admin.js       ← Metrics & user management API (Sprint 6)
│   │   ├── components/        ← Modular UI widgets & components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StorageUsageWidget.jsx
│   │   │   ├── StorageBreakdownWidget.jsx
│   │   │   ├── RecentFilesWidget.jsx
│   │   │   ├── ActivityTimelineWidget.jsx
│   │   │   ├── ProfileSecurityWidget.jsx
│   │   │   ├── NetworkStatusWidget.jsx (Sprint 5)
│   │   │   ├── AdminRoute.jsx (Sprint 6)
│   │   │   └── admin/         ← Admin control plane widgets (Sprint 6)
│   │   │       ├── SystemResourceGauges.jsx
│   │   │       ├── SystemHostInfoWidget.jsx
│   │   │       └── UserManagementTable.jsx
│   │   ├── pages/             ← Application route views
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FilesPage.jsx
│   │   │   └── AdminPage.jsx  (Sprint 6)
│   │   ├── context/           ← React Context (AuthContext)
│   │   ├── main.jsx           ← React entry point
│   │   ├── App.jsx            ← Root component & routing
│   │   └── index.css          ← Tailwind CSS v4 design system
│   ├── index.html
│   ├── vite.config.js         ← Vite dev server (host: '0.0.0.0')
│   └── package.json
├── docs/
│   ├── architecture.md        ← This file
│   └── lan-setup.md           ← LAN deployment & multi-device access guide
├── docker/                    ← Docker configs (Sprint 9+)
├── .gitignore
└── README.md
```

---

## Layered Architecture & Design Rules

The backend strictly separates responsibilities into distinct layers:

| Layer     | Directory  | Responsibility                                       | Depends On       |
|-----------|------------|------------------------------------------------------|------------------|
| **API**   | `api/`     | HTTP routing, request parsing, response formatting   | Services         |
| **Services** | `services/` | Business logic, permissions, file IO, quota limits | Database, Models |
| **Database** | `database/` | Connection pooling, session management, transactions | SQLAlchemy       |
| **Models**| `models/`  | Relational database schema & ORM mappings           | SQLAlchemy       |
| **Schemas**| `schemas/` | Pydantic data validation & JSON serialization        | Pydantic         |
| **Core**  | `core/`    | Security, token generation, environment & networking | Standard Lib     |

**Architectural Rules**:
1. **Separation of Concerns**: Controllers (API routes) never contain raw database queries or direct filesystem operations. They delegate to dedicated Service classes.
2. **User Isolation**: Storage is strictly partitioned under `storage/<user_id>/`. File system paths are decoupled from logical user paths via UUID disk storage.
3. **LAN Resilience**: The frontend dynamically computes backend target hosts at runtime based on `window.location.hostname`, allowing seamless operation on localhost or any LAN IP without rebuilds.

---

## Network & Multi-Device Access (Sprint 5)

### 1. Host Interface Binding
The server binds to `0.0.0.0`, allowing incoming connections across all physical and wireless network adapters.

### 2. Socket-Based IP Resolution
```
OS Kernel Routing Table
       ↓
UDP Socket Probe (8.8.8.8:80) [No Packets Sent]
       ↓
Primary Outbound LAN IP Extracted (e.g. 192.168.1.42)
       ↓
Injected into CORS Origins & /api/network/info
```

### 3. Dynamic Client Origin Handling
When a user visits `http://192.168.1.42:5173`:
- Frontend resolves base API URL to `http://192.168.1.42:8000/api`
- Backend CORS middleware validates origin `http://192.168.1.42:5173`
- Full access is granted with standard JWT authentication

---

## Technology Stack

| Technology       | Purpose                                                    |
|------------------|------------------------------------------------------------|
| **FastAPI**      | High-performance async Python backend & auto OpenAPI docs |
| **SQLAlchemy**   | Enterprise-grade Python ORM & transaction management       |
| **SQLite / PG**  | Development database with clear production migration path  |
| **React 18**     | Component-driven reactive single-page frontend             |
| **Vite**         | Next-gen frontend tooling with 0.0.0.0 LAN dev server     |
| **Tailwind CSS v4** | Modern utility-first styling with dark mode & tokens     |
| **Bcrypt & JWT** | Cryptographic password hashing & stateless session auth   |
| **psutil**       | Hardware and process resource telemetry & health monitoring |

---

## Administration & System Resource Monitoring (Sprint 6)

### 1. Control Plane & Role-Based Access Control
The platform implements explicit role separation (`user` vs `admin`) enforced via the `require_admin` dependency:
- Endpoints under `/api/admin/*` reject unauthorized requests with HTTP 401 or non-admin requests with HTTP 403.
- Client-side routes (`/admin`) are guarded via `AdminRoute.jsx` which redirects non-admin users to `/dashboard`.
- Prevent self-lockout: An administrator cannot suspend their own account or demote themselves if they are the sole active administrator.

### 2. Live Telemetry Engine (`psutil`)
```
Host Kernel / Hardware
       ↓ psutil
SystemMetricsService (app/services/system.py)
       ↓
GET /api/admin/metrics
       ↓ (Polling intervals: 3s / 5s / 10s / paused)
SystemResourceGauges.jsx & SystemHostInfoWidget.jsx
```
- **CPU**: Real-time utilization %, logical & physical core counts, and clock frequencies.
- **RAM**: Used vs total physical memory and non-swapped available memory.
- **Disk**: Partition saturation and free space for the user storage mount point.
- **Process**: Memory footprint (RSS) and active worker thread counts of the FastAPI ASGI process.

### 3. User Directory & Quota Control Plane
- Aggregated multi-user storage analytics via SQLAlchemy functions (`func.coalesce(func.sum(File.size_bytes), 0)`).
- Dynamic quota adjustments (`PUT /api/admin/users/{id}/quota`) supporting preset and custom byte allocations.
- Account suspension/activation (`PATCH /api/admin/users/{id}/status`) immediately preventing suspended users from authenticating.
- Full auditability: All administrative interventions are recorded in the `Activity` audit trail.

---

## Project Roadmap

- [x] **Sprint 1** — Project Foundation & Architecture Setup
- [x] **Sprint 2** — Authentication, Authorization & User Isolation (JWT, Bcrypt)
- [x] **Sprint 3** — Personal Cloud Storage Engine (Upload, Download, Folder hierarchy, Quotas)
- [x] **Sprint 4** — Cloud Dashboard & Activity System (Analytics, Feed, Profile Management)
- [x] **Sprint 5** — LAN Private Cloud Deployment (0.0.0.0 binding, Network Info, Multi-device UI)
- [x] **Sprint 6** — Administration & Resource Monitoring (`psutil` CPU/RAM/Disk metrics, User mgmt)
- [ ] **Sprint 7** — File Sharing & Collaboration Subsystem (Public links, tokens, expiry)
- [ ] **Sprint 8** — PostgreSQL & Database Migrations (PostgreSQL driver, Alembic)
- [ ] **Sprint 9** — Docker & Containerized Infrastructure (Dockerfiles, Docker Compose)
- [ ] **Sprint 10** — Cloud Infrastructure Services (MinIO Object Storage, Backups)
- [ ] **Sprint 11** — Automated Test Suites & Security Hardening (`pytest`, `vitest`, rate limits)
- [ ] **Sprint 12** — Optional Local AI Assistant (Ollama, local LLM document intelligence)
