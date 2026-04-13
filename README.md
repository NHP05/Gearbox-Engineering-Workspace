# Gearbox Engineering (CNPM DADN)

Gearbox Engineering is a full-stack web application for gearbox design workflows. It includes a 5-step engineering wizard, project management, AI assistant support, ticket-based user support, notifications, and admin audit logging.

## Overview

The repository has two main applications:

- FE: React + Vite frontend for wizard, dashboard, support, settings, and account pages.
- BE: Express + Sequelize backend for authentication, engineering APIs, exports, support, notifications, and admin operations.

The goal is to keep the design flow continuous: input parameters -> run calculations -> validate -> export reports -> track and support users.

## Current Features

### 1. 5-Step Wizard

- Step 1: Input parameters.
- Step 2: Motor selection.
- Step 3: Transmission design (belt/gear).
- Step 4: Shaft and bearing design.
- Step 5: Validation and report export.

### 2. Dashboard

- Project list and search.
- Quick reopen to wizard.
- Edit/delete project actions.
- Overview metrics.

### 3. Notifications

- Dashboard bell preview shows unread items only.
- Mark read, mark all read, pin/unpin, and delete actions.
- Full table page at /notifications.

### 4. Admin Audit Log

- Tracks admin actions (ban/delete account, delete project, role changes, credential reveal, etc.).
- Dashboard admin section previews latest unread audit logs only.
- Full table page at /admin/audit-logs.
- Supports mark read and mark all read.

### 5. Support Center

- Users create tickets and follow discussion threads.
- Admin manages all tickets, replies, and moderation actions.

### 6. AI Assistant

- Dedicated page for AI-assisted guidance in workflow and calculations.

### 7. Bilingual UI

- Vietnamese and English language support for the main UI flows.

## Repository Structure

```text
CNPM DADN/
├─ BE/
│  ├─ app.js
│  ├─ config/
│  ├─ controllers/
│  ├─ middlewares/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ scripts/
│  └─ utils/
├─ FE/
│  ├─ src/
│  │  ├─ api/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ i18n/
│  │  ├─ pages/
│  │  ├─ services/
│  │  ├─ styles/
│  │  └─ utils/
│  └─ public/
├─ DB/
├─ layout/
├─ setup_database.sql
└─ README.md
```

## Environment Requirements

- Node.js 18+ (Node 20 recommended)
- npm 9+
- MySQL (when SKIP_DB=false)

Use one runtime environment consistently (WSL or Windows) to avoid node_modules mismatch issues.

## Installation

From the repository root:

```bash
npm --prefix BE install
npm --prefix FE install
```

## Backend Configuration (.env)

Create BE/.env.

### Mock Mode (no DB required)

```env
PORT=8080
SKIP_DB=true
JWT_SECRET=change_me
```

### MySQL Mode

```env
PORT=8080
SKIP_DB=false
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=gearbox_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=change_me
```

Note: when running app.js, backend compatibility migration can add missing columns for users, notifications, support tables, and admin_action_logs.

## Run Locally

Use two terminals.

### Terminal 1 - Backend

```bash
cd BE
node app.js
```

Default backend URL: http://localhost:8080

### Terminal 2 - Frontend

```bash
cd FE
npm run dev
```

Default frontend URL: http://localhost:5173

## Frontend API Base URL

Axios client is configured at FE/src/api/axiosClient.js.

- Default: http://localhost:8080/api/v1
- Optional override via FE/.env:

```env
VITE_API_BASE_URL=http://localhost:8080
```

The client normalizes this value and appends /api/v1 when needed.

## Important Frontend Routes

- /login
- /register
- /dashboard
- /wizard/:step
- /notifications
- /admin/audit-logs
- /support
- /assistant
- /settings
- /profile

## Main API Groups

All API paths are under /api/v1.

### Auth

- POST /auth/register
- POST /auth/login
- GET /auth/me
- PUT /auth/me
- PUT /auth/change-password

### Project/Calculation

- GET /project/my-projects
- POST /project/create
- PUT /project/:id
- DELETE /project/:id
- POST /calculate/*
- POST /motor/calculate

### Support/Notification

- GET /support/tickets
- POST /support/contact
- GET /notification/my
- PUT /notification/:id/read
- PUT /notification/read-all

### Admin

- GET /admin/users
- GET /admin/projects
- GET /admin/action-logs
- PUT /admin/action-logs/:id/read
- PUT /admin/action-logs/read-all
- PUT /admin/users/:id/ban
- DELETE /admin/users/:id

## Troubleshooting

### 1. API path not found

- Make sure backend is running from app.js.
- Verify FE is calling the correct base URL (/api/v1).
- Verify endpoint exists in backend routes.

### 2. PowerShell npm.ps1 execution policy issue

Use:

```powershell
npm.cmd run dev
npm.cmd run build
```

Or run commands from WSL terminal.

### 3. Git "detected dubious ownership"

Run:

```bash
git config --global --add safe.directory '/home/dmin/DADN/CNPM DADN'
```

### 4. Database connection issue

- Temporarily switch to SKIP_DB=true for quick testing.
- Recheck DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.

## Development Notes

- Do not commit node_modules.
- Do not commit .env files.
- If schema changes are made, update SQL scripts and keep compatibility migration in app.js in sync.

## Operational Notes

- Restart backend after changing routes/controllers/models.
- If legacy data causes schema mismatch, run app.js so compatibility migration can apply before testing.