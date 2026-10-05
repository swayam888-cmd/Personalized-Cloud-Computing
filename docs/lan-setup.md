# 🌐 LAN Private Cloud Deployment Guide

This guide explains how to deploy and access your **Personalized Cloud Infrastructure** across multiple devices on the same Local Area Network (LAN) — turning your computer into a private home or office cloud server.

---

## 📋 Overview

In Sprint 5, the cloud infrastructure was upgraded from a strictly single-machine `localhost` setup into a full **Local Area Network (LAN) private cloud server**. 

Any device connected to the same Wi-Fi or Ethernet network (smartphones, tablets, other laptops, desktop PCs) can access the personal cloud web application, upload and download files, manage folders, and view activity logs without requiring public internet hosting.

```
                  ┌─────────────────────────────────────────────────────┐
                  │                 Wi-Fi / LAN Router                  │
                  │                 (e.g., 192.168.1.1)                 │
                  └───────────┬──────────────┬──────────────┬───────────┘
                              │              │              │
                              ▼              ▼              ▼
                    ┌──────────────────┐ ┌────────┐ ┌───────────────┐
                    │   Cloud Server   │ │ Phone  │ │ Second Laptop │
                    │   (Host Machine) │ │ Client │ │    Client     │
                    │   192.168.1.42   │ │ (iOS/  │ │ (Win/Mac/Linux│
                    │                  │ │ Android│ │               │
                    │ Vite:  port 5173 │ └────────┘ └───────────────┘
                    │ FastAPI:port 8000│
                    └──────────────────┘
```

---

## ⚙️ How It Works

1. **Host Binding (`0.0.0.0`)**:
   - By default, servers bind to `127.0.0.1` (loopback), which only accepts connections from the same machine.
   - Binding to `0.0.0.0` instructs the operating system to listen on **all available network interfaces** (Ethernet, Wi-Fi, loopback).

2. **Automatic LAN IP Detection**:
   - The backend includes a UDP socket detection utility (`app/core/network.py`) that queries the routing table to find the machine's primary LAN IP address (e.g., `192.168.1.42` or `10.0.0.5`).
   - This prevents having to manually configure IP addresses when DHCP changes.

3. **Dynamic CORS (Cross-Origin Resource Sharing)**:
   - When `LAN_MODE=true`, the FastAPI backend automatically adds the detected LAN IP origins (`http://<LAN_IP>:5173` and `http://<LAN_IP>:8000`) to the CORS whitelist, allowing seamless API requests from external browser clients.

4. **Dynamic Frontend API Resolution**:
   - The frontend Axios client (`src/api/client.js`) detects the current hostname from `window.location.hostname`. When accessed from a phone at `http://192.168.1.42:5173`, it automatically directs API calls to `http://192.168.1.42:8000/api`.

5. **Network Discovery API & Dashboard Widget**:
   - Public endpoint `GET /api/network/info` reports the server's network state.
   - The dashboard includes a dedicated **Network Status Widget** showing the LAN IP, clickable copy buttons, and step-by-step connection instructions for other devices.

---

## 🚀 Setup & Launch Instructions

### 1. Configure the Backend

Open `backend/.env` (or copy from `backend/.env.example`):

```bash
# Enable LAN access
HOST=0.0.0.0
PORT=8000
FRONTEND_PORT=5173
LAN_MODE=true
```

### 2. Configure the Frontend

The Vite configuration (`frontend/vite.config.js`) is already pre-configured to bind to all interfaces:

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,
  },
})
```

### 3. Start the Backend Server

From the `backend/` directory:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

When started with `LAN_MODE=true`, the server console displays:

```
============================================================
☁️  PERSONALIZED CLOUD COMPUTING — SERVER STARTUP
============================================================
  Host:            0.0.0.0
  Port:            8000
  LAN Mode:        ENABLED
  LAN IP:          192.168.1.42
  Local URL:       http://localhost:8000
  LAN URL:         http://192.168.1.42:8000
  Frontend LAN:    http://192.168.1.42:5173
  Swagger Docs:    http://192.168.1.42:8000/docs
============================================================
```

### 4. Start the Frontend Server

From the `frontend/` directory:

```bash
cd frontend
npm run dev
```

Vite will print both local and network URLs:

```
  VITE v8.x.x  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.42:5173/
```

---

## 📱 Connecting From Other Devices

1. Connect your smartphone, tablet, or secondary laptop to the **same Wi-Fi network** as the server.
2. Open any modern web browser (Safari, Chrome, Firefox, Edge).
3. Navigate to:
   ```
   http://<SERVER_LAN_IP>:5173
   ```
   *(Example: `http://192.168.1.42:5173`)*
4. Log in with your existing account or register a new user.
5. You can now upload photos, download documents, and manage your cloud drive directly from your mobile device!

---

## 🔍 Network Diagnostics & Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/health` | `GET` | No | System health and database connectivity |
| `/api/network/info` | `GET` | No | Server hostname, LAN IP, and connection URLs |
| `/docs` | `GET` | No | Interactive OpenAPI / Swagger documentation |

### Example Network Info Response:

```json
{
  "hostname": "cloud-server",
  "platform": "Darwin",
  "lan_mode": true,
  "server_host": "0.0.0.0",
  "server_port": 8000,
  "lan_ip": "192.168.1.42",
  "lan_accessible": true,
  "local_url": "http://localhost:8000",
  "lan_url": "http://192.168.1.42:8000",
  "frontend_lan_url": "http://192.168.1.42:5173",
  "timestamp": "2026-10-05T14:30:00.000000+00:00"
}
```

---

## 🛠️ Troubleshooting & Firewall Settings

### Problem 1: Client device cannot connect (Connection Timed Out)
- **Check Wi-Fi Network**: Ensure both devices are connected to the exact same Wi-Fi network / SSID (not a Guest Wi-Fi with isolation enabled).
- **macOS Firewall**: 
  - Go to `System Settings` → `Network` → `Firewall`.
  - Ensure incoming connections are permitted for `Python` and `Node`.
- **Windows Firewall**:
  - Open `Windows Defender Firewall` → `Allow an app or feature through Windows Defender Firewall`.
  - Allow `python.exe` and `node.exe` on Private Networks.
- **Linux (`ufw` / `iptables`)**:
  ```bash
  sudo ufw allow 8000/tcp
  sudo ufw allow 5173/tcp
  ```

### Problem 2: "AP Isolation" / "Client Isolation" on Router
- Some public or corporate Wi-Fi routers (and guest networks) enable "Client Isolation", which blocks connected devices from communicating with one another.
- **Solution**: Use a private home Wi-Fi network, disable AP isolation in router settings, or create a mobile hotspot from your phone/laptop.

### Problem 3: IP Address Changed
- If your router reboots or DHCP assigns a new IP address, the backend automatically detects the new IP at startup.
- Simply restart the backend server or check the **Network Status Widget** on the dashboard for the updated URL.

---

## 🔒 Security Best Practices

1. **Private Network Only**: LAN mode is designed for trusted local networks (home, lab, or office). Do not expose ports `8000` or `5173` directly to the public internet without a reverse proxy (Nginx / Caddy), TLS/HTTPS encryption, and rate limiting.
2. **User Isolation**: All file storage remains strictly isolated per user (`storage/<user_id>/`). Even across multiple LAN devices, users cannot access other users' data.
3. **JWT Authentication**: All file operations require valid JWT bearer tokens.
