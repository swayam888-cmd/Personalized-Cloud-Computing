# 📘 User Guide: How to Run & Verify All Features

**Personalized Cloud Infrastructure for Secure Data Storage and Management**  
*Comprehensive operational manual and feature testing guide covering Sprint 1 through Sprint 5.*

---

## 📑 Table of Contents

1. [How to Run the Servers](#1-how-to-run-the-servers)
2. [Feature Verification Guide](#2-feature-verification-guide)
   - [Sprint 1: System Health & API Docs](#sprint-1-system-health--api-docs)
   - [Sprint 2: Authentication & Access Control](#sprint-2-authentication--access-control)
   - [Sprint 3: Cloud File & Folder Storage Engine](#sprint-3-cloud-file--folder-storage-engine)
   - [Sprint 4: Analytics Dashboard & Activity Logs](#sprint-4-analytics-dashboard--activity-logs)
   - [Sprint 5: LAN Multi-Device Deployment](#sprint-5-lan-multi-device-deployment)
3. [Step-by-Step 10-Minute Verification Checklist](#3-step-by-step-10-minute-verification-checklist)
4. [Troubleshooting & FAQs](#4-troubleshooting--faqs)

---

## 1. How to Run the Servers

To operate the personalized cloud platform, two processes must run:
1. **FastAPI Backend Server** (Port `8000`)
2. **Vite + React Frontend Server** (Port `5173`)

### 🔹 Terminal 1: Start Backend Server

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Activate Python virtual environment
source venv/bin/activate       # On macOS / Linux
# venv\Scripts\activate        # On Windows

# 3. Ensure environment variables exist
# (If not created yet: cp .env.example .env)

# 4. Start the FastAPI ASGI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Note on `--host 0.0.0.0`**: This binds the backend to all physical and wireless network cards so devices on your Wi-Fi can access the API.

---

### 🔹 Terminal 2: Start Frontend Server

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Start the Vite development server
npm run dev
```

The terminal will display:
```
  VITE v8.x.x  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://<YOUR_LAN_IP>:5173/
```

---

## 2. Feature Verification Guide

### Sprint 1: System Health & API Docs

| Feature | How to Check | Expected Result |
| :--- | :--- | :--- |
| **Backend Health** | Open `http://localhost:8000/api/health` | Returns `{"status": "healthy", "database": "connected", ...}` with HTTP 200. |
| **Interactive API Docs** | Open `http://localhost:8000/docs` | Interactive Swagger UI displaying all available API endpoints categorized by tag. |
| **Alternative Docs** | Open `http://localhost:8000/redoc` | Clean ReDoc documentation for all API routes and schemas. |

---

### Sprint 2: Authentication & Access Control

| Feature | How to Check | Expected Result |
| :--- | :--- | :--- |
| **User Registration** | Navigate to `http://localhost:5173/signup`. Enter a unique username, valid email, and secure password (≥ 8 characters). | Account is created, user is automatically logged in or redirected to `/login`, and initial storage folder is initialized. |
| **User Login** | Go to `http://localhost:5173/login`. Enter registered credentials. | Successful authentication stores JWT token in browser `localStorage` and redirects to `/dashboard`. |
| **Route Protection** | Open an incognito/private browser tab and directly enter `http://localhost:5173/dashboard` or `http://localhost:5173/files`. | App automatically intercepts unauthorized access and redirects back to `/login`. |
| **Logout** | Click the **Sign Out** button in the sidebar. | JWT token is cleared from `localStorage` and user is redirected to `/login`. |

---

### Sprint 3: Cloud File & Folder Storage Engine

Navigate to the **Files** page (`http://localhost:5173/files`):

| Feature | How to Check | Expected Result |
| :--- | :--- | :--- |
| **File Upload** | Click **Upload File** button or drag-and-drop any document/image into the upload dropzone. | Progress indicator finishes, file appears in the list with proper icon, file size, upload timestamp, and MIME type. |
| **Folder Creation** | Click **New Folder**, enter a name (e.g., `Projects` or `Photos`), and confirm. | Folder appears in the directory with a folder icon and `0 items`. |
| **Folder Navigation** | Double-click or click on the created folder. | Navigates inside the folder. The breadcrumb path updates (e.g., `Home > Projects`). |
| **Nested Uploads** | Upload a file while inside a folder. | File is stored strictly inside that folder without appearing in root. |
| **File Download** | Click the **Download** action button on any uploaded file. | Browser downloads the exact binary file with its original filename. |
| **File / Folder Rename** | Click the options menu (`...`) on a file or folder and select **Rename**. | Name updates in database and updates instantly in the UI. |
| **Delete** | Click the **Delete** button and confirm. | File or folder is permanently removed. For folders, all nested children are deleted recursively. |
| **Storage Quota Enforcement** | Check user quota in the sidebar or try uploading a file exceeding max size (default 50 MB) or exceeding total quota. | System blocks upload and returns an error notifying that storage quota is exceeded. |
| **Physical Isolation** | Inspect `backend/storage/<user_id>/` in your terminal. | Files are stored under dedicated user directories with UUID filenames on disk, preventing path collisions and tampering. |

---

### Sprint 4: Analytics Dashboard & Activity Logs

Navigate to the **Dashboard** page (`http://localhost:5173/dashboard`):

| Feature | How to Check | Expected Result |
| :--- | :--- | :--- |
| **Storage Usage Meter** | Look at the **Storage Usage** card at top left. | Displays exact used MB/GB, total quota (e.g. 1024 MB), and an animated visual progress bar with percentage. |
| **Category Breakdown** | Look at the **Storage Breakdown** card. | Visual color-coded bars categorize your storage into **Documents**, **Images**, **Media**, and **Other**. |
| **Recent Files Widget** | View the **Recent Files** section. | Shows the 5 most recently uploaded or modified files with direct quick-action buttons (Download / View). |
| **Activity Timeline** | Scroll to the **Activity Timeline** widget. | Full audit trail displaying recent actions: `LOGIN`, `UPLOAD`, `CREATE_FOLDER`, `DELETE`, etc., with timestamps and IP records. |
| **Profile Management** | In the **Account & Security** widget, edit your display username or email and click Save. | Profile updates immediately without requiring relogin. |
| **Password Change** | In the Security card, input current password and a new password (≥ 8 characters). | Password is updated securely using Bcrypt hashing, and the action is recorded in the activity log. |

---

### Sprint 5: LAN Multi-Device Deployment

| Feature | How to Check | Expected Result |
| :--- | :--- | :--- |
| **Network Status Widget** | On the dashboard, locate the **Network Status** card. | Shows Server Host, Status (`LAN Accessible`), and your machine's primary Wi-Fi/LAN IP address. |
| **One-Click URL Copy** | Click the **Copy** button next to the LAN URL. | URL (e.g. `http://192.168.1.42:5173`) is copied to system clipboard with a "Copied!" checkmark feedback. |
| **Mobile Access** | Connect your smartphone or tablet to the **same Wi-Fi**. Open browser (Safari / Chrome) and go to `http://<YOUR_LAN_IP>:5173`. | Mobile-responsive cloud login screen loads seamlessly. |
| **Mobile File Upload** | Log in on your phone, navigate to **Files**, and upload a photo directly from your camera roll. | Photo uploads over local Wi-Fi. Refreshing your desktop shows the photo immediately! |
| **Public Discovery Endpoint** | In any browser, open `http://<YOUR_LAN_IP>:8000/api/network/info`. | Returns JSON with server hostname, LAN IP, and connectivity status without requiring authentication. |

---

## 3. Step-by-Step 10-Minute Verification Checklist

Follow this quick walkthrough to verify the full cloud pipeline from start to finish:

```
[ ] Step 1: Open Terminal & start Backend (uvicorn app.main:app --host 0.0.0.0 --port 8000)
[ ] Step 2: Open Terminal & start Frontend (npm run dev)
[ ] Step 3: Open browser to http://localhost:5173 (redirects to /login)
[ ] Step 4: Click "Sign up" and register account: demo_user / demo@cloud.local / Pass1234!
[ ] Step 5: Verify automatic redirect to Dashboard (/dashboard)
[ ] Step 6: Verify Network Status widget shows your Wi-Fi LAN IP (e.g. 192.168.x.x)
[ ] Step 7: Navigate to "Files" via sidebar (/files)
[ ] Step 8: Click "New Folder" -> create "Sprint_Demo"
[ ] Step 9: Open "Sprint_Demo" folder and click "Upload File" -> upload any image/PDF
[ ] Step 10: Click the Download icon on the uploaded file -> verify download matches original
[ ] Step 11: Return to Dashboard (/dashboard) -> verify Storage Meter & Category Breakdown updated
[ ] Step 12: Verify Activity Timeline records: REGISTER, LOGIN, CREATE_FOLDER, UPLOAD
[ ] Step 13: (LAN Test) Open your phone's browser, connect to Wi-Fi, visit http://<LAN_IP>:5173
[ ] Step 14: Log in with demo_user on your phone -> verify you see the uploaded file
[ ] Step 15: Click "Sign Out" on desktop -> verify token wiped and redirect to /login
```

---

## 4. Troubleshooting & FAQs

### Q1: My phone says "Cannot Connect to the Server" (Connection Timed Out)?
- **Check Wi-Fi Network**: Both the server computer and your mobile phone must be on the **same Wi-Fi network**.
- **Check Firewall**: Ensure your computer's firewall allows incoming connections on ports `8000` (FastAPI) and `5173` (Vite).
- **AP Isolation**: Some public or university Wi-Fi networks block device-to-device communication ("Client Isolation"). For best testing, use a private home Wi-Fi or turn on Mobile Hotspot from your phone.

### Q2: How do I reset or start with a fresh database?
- Stop the backend server.
- Delete the local database file: `rm backend/cloud.db`
- Delete user storage folder: `rm -rf backend/storage/*`
- Restart backend server. The database tables will automatically re-initialize cleanly.

### Q3: Where are my files stored physically?
- All physical files are stored in `backend/storage/<user_id>/<file_uuid>`.
- The real filename and folder structure are safely maintained in the database metadata table, preventing path injection attacks and naming conflicts.
