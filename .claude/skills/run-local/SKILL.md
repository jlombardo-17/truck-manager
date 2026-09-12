---
description: Launch truck-manager locally (backend NestJS + frontend Vite) against local MySQL
---

# Run Truck Manager Locally

Launches the backend (NestJS on :3000) and frontend (Vite on :5173) against the local MySQL instance.

## Prerequisites

- MySQL 8.0 running as service `MySQL80`
- Database `truck_manager` exists
- `backend/.env` pointing to `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USERNAME=root`
- Both `backend/node_modules` and `frontend/node_modules` installed

## Steps

### 1. Verify MySQL is running

```powershell
Get-Service -Name "MySQL80" | Select-Object Name, Status
```

If stopped: `Start-Service MySQL80`

### 2. Check ports are free

```powershell
netstat -ano | findstr ":3000 "
netstat -ano | findstr ":5173 "
```

Kill any process occupying them: `taskkill /PID <PID> /F`

### 3. Launch backend (in background)

```powershell
Set-Location C:\Users\Usuario\Proyectos\truck-manager\backend
npm run start:dev
```

Wait for: `🚀 Application is running on: http://localhost:3000`

### 4. Launch frontend (in background)

```powershell
Set-Location C:\Users\Usuario\Proyectos\truck-manager\frontend
npm run dev
```

Wait for: `➜  Local:   http://localhost:5173/`

### 5. Smoke test

```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Select-Object -ExpandProperty Content
# Expected: 🚚 Welcome to Truck Manager API!
```

## Credentials (dev seed user)

- **Email:** `admin@truckmanager.local`
- **Password:** `admin123`

## Switching between local and Railway DB

Edit `backend/.env`:

```env
# Local MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=<local password>
DB_DATABASE=truck_manager

# Railway (production)
# DB_HOST=junction.proxy.rlwy.net
# DB_PORT=40077
# DB_USERNAME=root
# DB_PASSWORD=<railway password>
# DB_DATABASE=truck_manager
```
