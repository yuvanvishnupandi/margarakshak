# Marga Rakshak - Traffic Violation Management System

Marga Rakshak is a full-stack traffic violation management portal built for citizens and police officers. The system lets citizens register vehicles, submit traffic violation reports with evidence, track challans, pay fines, view notifications, manage rewards, and monitor trust score history. Police users can review reports, verify or reject submissions, create challans, search vehicles, manage rules, review appeals, and monitor analytics through an operational dashboard.

## GitHub About Description

Full-stack traffic violation management system with React, FastAPI, MySQL, citizen reporting, police verification, challan payments, rewards, notifications, trust scores, analytics, and vehicle lookup.

## Features

- Citizen and police authentication with JWT-based sessions
- Citizen registration with linked vehicle information
- Police officer registration and login
- Citizen dashboard for reports, challans, rewards, payments, vehicles, and profile data
- Violation report submission with evidence upload support
- Police review workflow for pending reports
- Challan creation, payment tracking, and challan history
- Appeal submission and police appeal review
- Vehicle search by plate number
- Violation rule management
- Trust score tracking and history
- Reward wallet and redemption workflow
- Notification system with unread counts and read status updates
- Analytics dashboard with summaries, leaderboards, violation trends, heatmap data, and recent activity
- Road condition and weather-related frontend pages
- Role-based frontend navigation for citizens and police users

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Tailwind CSS
- Recharts
- Leaflet and React Leaflet
- Lucide React icons

### Backend

- FastAPI
- Uvicorn
- PyMySQL / MySQL connector
- Python JWT authentication
- Pydantic
- MySQL

### Database

- MySQL schema and migrations are stored in the `db/` directory.
- Additional setup and utility scripts are stored in the `scripts/` and `server/` directories.

## Project Structure

```txt
traffic_violation/
+-- frontend/              # React + Vite frontend application
|   +-- src/
|   |   +-- pages/         # Citizen and police UI pages
|   |   +-- components/    # Shared UI components
|   |   +-- context/       # Toast and theme context
|   |   +-- config.js      # API base URL configuration
|   +-- package.json
+-- server/                # FastAPI backend expected by the frontend
|   +-- main.py            # FastAPI app entrypoint
|   +-- routes/            # API route modules
|   +-- middleware/        # Authentication helpers
|   +-- services/          # Service-layer helpers
|   +-- uploads/           # Uploaded evidence files
|   +-- requirements.txt   # Python dependencies
+-- backend/               # Express backend prototype/alternate backend
+-- db/                    # SQL schema, triggers, migrations, seed data
+-- scripts/               # Utility and verification scripts
+-- package.json           # Workspace scripts
```

## Important Backend Note

The frontend expects the FastAPI backend inside `server/`.

Use this backend entrypoint:

```txt
server/main.py
```

Use this ASGI app target:

```txt
main:app
```

The `backend/` folder contains an Express backend, but it does not expose all FastAPI routes expected by the current frontend. For the current frontend, deploy and run `server/`, not `backend/`.

## Main API Routes

The FastAPI app mounts route groups in `server/main.py`.

```txt
GET    /api/health
POST   /api/auth/citizen/register
POST   /api/auth/citizen/login
POST   /api/auth/police/register
POST   /api/auth/police/login
GET    /api/auth/profile
PUT    /api/auth/profile
POST   /api/reports/create
POST   /api/reports/upload-evidence/{report_id}
GET    /api/reports/my-reports/{citizen_id}
GET    /api/reports/police/pending
PUT    /api/reports/police/process/{report_id}
POST   /api/challans/create
GET    /api/challans/citizen/{citizen_id}
GET    /api/challans/my
PUT    /api/challans/pay/{challan_id}
POST   /api/appeals/submit
GET    /api/appeals/citizen/{citizen_id}
GET    /api/appeals/police/pending
PUT    /api/appeals/{appeal_id}/review
GET    /api/analytics/summary
GET    /api/analytics/police-summary
GET    /api/analytics/leaderboard
GET    /api/analytics/heatmap-data
GET    /api/vehicles/search/{plate_no}
GET    /api/rules/all
POST   /api/rules/create
GET    /api/trust/history/{citizen_id}
GET    /api/citizen/rewards/wallet/{citizen_id}
POST   /api/citizen/rewards/redeem
GET    /api/citizen/notifications/{citizen_id}
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- Python 3.10 or newer
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd traffic_violation
```

### 2. Set Up the Database

Create a MySQL database and import the schema:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS traffic_violation_db;"
mysql -u root -p traffic_violation_db < db/schema.sql
```

If needed, apply additional migrations from the `db/` directory, such as notification, appeals, rewards, triggers, and trust score SQL files.

### 3. Run the FastAPI Backend

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

The backend should be available at:

```txt
http://localhost:5000
```

FastAPI docs:

```txt
http://localhost:5000/docs
```

### 4. Run the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at:

```txt
http://localhost:5173
```

## Frontend API Configuration

The frontend API base URL is configured in:

```txt
frontend/src/config.js
```

It uses:

```js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://margarakshak-backend.onrender.com'
```

For local development, create a frontend environment file:

```txt
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000
```

Restart the frontend dev server after changing environment variables.

## Render Deployment

Deploy the FastAPI backend as a Render Web Service.

### Backend Render Settings

```txt
Service Type: Web Service
Runtime: Python 3
Root Directory: server
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

The expected backend URL format is:

```txt
https://your-backend-service.onrender.com
```

The citizen registration endpoint should be:

```txt
POST https://your-backend-service.onrender.com/api/auth/citizen/register
```

### Frontend Render Settings

Deploy the frontend as a Render Static Site.

```txt
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

Set this environment variable in the frontend service:

```txt
VITE_API_URL=https://your-backend-service.onrender.com
```

## Database Configuration Warning

Some backend route files currently contain hardcoded local MySQL credentials such as `127.0.0.1`, `root`, and a local password. This works only for local development. For production deployment, update the backend database configuration to read from environment variables before deploying with a hosted database.

Recommended environment variables:

```env
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=traffic_violation_db
JWT_SECRET=replace-with-a-secure-secret
```

## Useful Commands

Run frontend:

```bash
cd frontend
npm run dev
```

Build frontend:

```bash
cd frontend
npm run build
```

Run FastAPI backend:

```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Check backend health:

```bash
curl http://localhost:5000/api/health
```

## Roles

### Citizen

- Register and log in
- Submit violation reports
- Upload evidence
- View submitted reports
- View and pay challans
- Track payment history
- View notifications
- Check trust score and rewards
- Manage vehicles and profile

### Police

- Register and log in
- Review pending reports
- Approve or reject reports
- Create challans
- Review appeals
- Search vehicles
- Manage violation rules
- View officer stats and system analytics
- Monitor overdue challans

## Current Status

This project is suitable as a DBMS/full-stack academic project and demonstrates end-to-end workflows for traffic violation reporting, verification, challan generation, payment tracking, rewards, notifications, analytics, and role-based access.

Before production use, the main recommended improvements are:

- Move all database credentials to environment variables
- Add stronger authentication middleware coverage across all protected routes
- Add automated backend and frontend tests
- Configure secure CORS origins instead of allowing all origins
- Use a hosted MySQL database that is reachable from the deployed backend
- Store uploaded evidence files in persistent object storage for production

## License

This project is currently provided for academic and demonstration purposes. Add a license file before publishing for public reuse.
