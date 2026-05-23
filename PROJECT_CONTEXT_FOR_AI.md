# MARGA RAKSHAK - COMPLETE PROJECT CONTEXT

## 📌 PROJECT OVERVIEW

**Project Name:** Marga Rakshak (Traffic Violation Management System)  
**Type:** Full-Stack Web Application  
**Purpose:** University DBMS Lab Project - Traffic violation reporting, police verification, challan issuance, and citizen trust score management  
**Architecture:** Monorepo with separate backend (Python FastAPI) and frontend (React + Vite)  

---

## 🏗️ COMPLETE PROJECT STRUCTURE

```
traffic_violation/
│
├── backend/                          # OLD Node.js backend (DEPRECATED - DO NOT USE)
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── package.json
│   └── server.js
│
├── server/                           # ✅ CURRENT BACKEND (Python FastAPI)
│   ├── __pycache__/
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py                  # JWT authentication middleware
│   ├── models/
│   │   └── README.txt
│   ├── routes/                       # ✅ API ENDPOINTS
│   │   ├── __init__.py
│   │   ├── analytics.py             # GET /api/analytics/*
│   │   ├── auth.py                  # POST /api/auth/citizen/register, /api/auth/citizen/login, etc.
│   │   ├── challans.py              # POST /api/challans/create, GET /api/challans/my, PUT /api/challans/pay/:id
│   │   ├── face_recognition.py      # Face encoding endpoints
│   │   ├── police.py                # Police-specific endpoints
│   │   ├── reports.py               # POST /api/reports/create, GET /api/reports/police/pending, etc.
│   │   ├── rules.py                 # GET /api/rules/all
│   │   ├── trust.py                 # Trust score history
│   │   └── vehicles.py              # Vehicle search endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   └── face_service.py          # Face recognition service
│   ├── uploads/evidence/             # Uploaded evidence photos
│   ├── .env                          # Environment variables
│   ├── config.py                     # Configuration settings
│   ├── database.py                   # Database connection pool
│   ├── main.py                       # ✅ FastAPI app entry point (port 5000)
│   ├── requirements.txt              # Python dependencies
│   └── [various test scripts]
│
├── frontend/                         # ✅ REACT FRONTEND (Vite)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── videos/
│   │   │   │   ├── yolo_demo1.mp4
│   │   │   │   └── yolo_speed.mp4
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   └── BaseComponents.jsx    # Reusable UI components
│   │   │   ├── DataTable.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── Navbar.jsx                # ✅ Navigation bar with role-based menus
│   │   │   ├── PaymentModal.jsx          # Payment modal (legacy)
│   │   │   ├── ReportForm.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── TrustScoreChart.jsx
│   │   ├── context/
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx          # Toast notifications
│   │   ├── pages/                        # ✅ ALL PAGE COMPONENTS
│   │   │   ├── About.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── CitizenDashboard.jsx
│   │   │   ├── FutureScopes.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Leaderboard.jsx           # Citizens ranked by trust score
│   │   │   ├── Login.jsx                 # Citizen login
│   │   │   ├── MyReports.jsx             # Citizen's submitted reports (3s polling)
│   │   │   ├── MyChallans.jsx            # ✅ Citizen's challans (3s polling)
│   │   │   ├── PaymentPage.jsx           # ✅ Payment page with future scope section
│   │   │   ├── PoliceCommand.jsx         # Police dashboard
│   │   │   ├── PoliceLogin.jsx
│   │   │   ├── PoliceRegister.jsx
│   │   │   ├── Profile.jsx               # Shows trust score, rewards
│   │   │   ├── Register.jsx              # ✅ Citizen registration WITH VEHICLE NUMBER
│   │   │   ├── ReviewReports.jsx         # ✅ Police review & verify/reject reports
│   │   │   ├── ChallanCreation.jsx       # ✅ Police challan creation page
│   │   │   ├── Rules.jsx
│   │   │   ├── SubmitReport.jsx          # Citizen submits violation report
│   │   │   └── VehicleSearch.jsx         # Police vehicle lookup
│   │   ├── App.jsx                       # ✅ Router with all routes
│   │   ├── App.css
│   │   ├── config.js                     # API configuration
│   │   ├── index.css                     # TailwindCSS imports
│   │   └── main.jsx                      # React entry point
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json                      # Frontend dependencies
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── db/                                   # ✅ DATABASE FILES
│   ├── schema.sql                        # Complete database schema
│   ├── database_triggers.sql             # ✅ Trust score auto-update triggers
│   ├── add_vehicle_citizen_link.sql      # ✅ Migration: adds citizen_id to VEHICLES
│   ├── insert_mock_reports.sql
│   ├── marga_rakshak_triggers.sql
│   └── reports_enhancement.sql
│
├── scripts/                              # ✅ AUTOMATION SCRIPTS
│   ├── install_triggers.bat              # ✅ Installs MySQL trust score triggers
│   ├── migrate_vehicle_citizen_link.bat  # ✅ Runs vehicle-citizen migration
│   ├── setup_demo_environment.bat        # Sets up test accounts
│   ├── generate_password_hashes.py       # Password hash generator
│   ├── verify_complete_system.py         # ✅ Complete system verification
│   ├── verify_database_persistence.py    # Database persistence check
│   └── test_trust_score_triggers.py      # Trust score trigger test
│
├── .qoder/
│   └── settings.local.json
│
├── node_modules/
├── package.json                          # Root package (monorepo config)
├── package-lock.json
│
└── DOCUMENTATION FILES:
    ├── README.md
    ├── COMPLETE_SYSTEM_GUARANTEE.md      # ✅ Complete system guide
    ├── CHALLAN_SYSTEM_IMPLEMENTATION.md  # ✅ Challan system details
    ├── TRUST_SCORE_SETUP_GUIDE.md        # Trust score setup
    └── [various other .md files]
```

---

## 🔧 TECHNOLOGY STACK

### Backend
- **Framework:** Python FastAPI
- **Database:** MySQL 8.0
- **Database Driver:** PyMySQL
- **Authentication:** JWT (PyJWT) + bcrypt
- **Server:** Uvicorn (ASGI)
- **Port:** 5000

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.21
- **Styling:** TailwindCSS 3.4.1
- **Routing:** React Router DOM 6
- **State Management:** React Hooks (useState, useEffect)
- **Port:** 5173

### Database
- **Engine:** MySQL 8.0 (InnoDB)
- **Features:** Foreign keys, triggers, indexes, stored procedures
- **Character Set:** utf8mb4

---

## 🗄️ DATABASE SCHEMA (KEY TABLES)

### CITIZENS
```sql
citizen_id (INT, PK, AUTO_INCREMENT)
full_name (VARCHAR 120)
email (VARCHAR 255, UNIQUE)
phone_no (VARCHAR 20)
password_hash (VARCHAR 255)
face_encoding (BLOB, NULL)
trust_score (INT, DEFAULT 50, CHECK 0-200)
reward_points (INT, DEFAULT 0)
account_status (ENUM: Active/Suspended/Banned)
created_at, updated_at, valid_from, valid_to (DATETIME)
```

### VEHICLES
```sql
plate_no (VARCHAR 20, PK)
vehicle_model (VARCHAR 100)
vehicle_type (ENUM: Car/Motorcycle/Truck/Bus/Auto-Rickshaw/Bicycle/Other)
owner_name (VARCHAR 120)
owner_type (ENUM: Individual/Corporate/Government)
citizen_id (INT, FK → CITIZENS.citizen_id) ✅ ADDED VIA MIGRATION
registered_at (DATETIME)
```

### REPORTS
```sql
report_id (INT, PK, AUTO_INCREMENT)
citizen_id (INT, FK → CITIZENS.citizen_id)
plate_no (VARCHAR 20, FK → VEHICLES.plate_no)
violation_type (VARCHAR 100)
location_coords (VARCHAR 60)
location_address (VARCHAR 300)
description (TEXT)
status (ENUM: Pending/Verified/Rejected)
date_reported, reviewed_at (DATETIME)
reviewed_by (VARCHAR 20, FK → POLICE_OFFICERS.badge_no)
rejection_reason (TEXT)
```

### CHALLANS
```sql
challan_id (INT, PK, AUTO_INCREMENT)
event_id (INT, FK → VIOLATION_EVENTS.event_id)
citizen_id (INT, FK → CITIZENS.citizen_id)
badge_no (VARCHAR 20, FK → POLICE_OFFICERS.badge_no)
total_amount (DECIMAL 10,2)
payment_status (ENUM: Unpaid/Paid/Overdue/Waived/Disputed)
issue_date, due_date (DATE)
paid_at (DATETIME, NULL)
transaction_ref (VARCHAR 100, NULL)
valid_from, valid_to, created_at, updated_at (DATETIME)
```

### VIOLATION_EVENTS
```sql
event_id (INT, PK, AUTO_INCREMENT)
report_id (INT, FK → REPORTS.report_id)
rule_id (INT, FK → VIOLATION_RULES.rule_id)
plate_no (VARCHAR 20, FK → VEHICLES.plate_no)
event_timestamp (DATETIME)
location_coords (VARCHAR 60)
notes (TEXT)
```

### VIOLATION_RULES
```sql
rule_id (INT, PK, AUTO_INCREMENT)
rule_code (VARCHAR 20, UNIQUE)
rule_name (VARCHAR 150)
description (TEXT)
base_fine_amount (DECIMAL 10,2)
severity (ENUM: Minor/Moderate/Major/Critical)
violation_time (ENUM: Daytime/Nighttime/Anytime)
is_active (BOOLEAN)
```

### POLICE_OFFICERS
```sql
badge_no (VARCHAR 20, PK)
full_name (VARCHAR 120)
officer_rank (VARCHAR 50)
station_code (VARCHAR 30)
email (VARCHAR 255, UNIQUE)
password_hash (VARCHAR 255)
phone_no (VARCHAR 20)
is_active (BOOLEAN)
```

---

## 🔑 KEY API ENDPOINTS

### Authentication
```
POST /api/auth/citizen/register       - Register citizen (with vehicle)
POST /api/auth/citizen/login          - Citizen login
POST /api/auth/police/register        - Register police officer
POST /api/auth/police/login           - Police login
GET  /api/auth/profile                - Get user profile
```

### Reports
```
POST   /api/reports/create            - Citizen submits report
GET    /api/reports/my                - Get citizen's reports
GET    /api/reports/police/pending    - Get pending reports (police)
PUT    /api/reports/police/process/:id - Police verify/reject report
DELETE /api/reports/:id               - Delete report
```

### Challans
```
POST /api/challans/create             - ✅ Create challan (police verify)
GET  /api/challans/my?citizen_id=:id  - ✅ Get citizen's challans
GET  /api/challans/citizen/:id        - Get challans by citizen ID
PUT  /api/challans/pay/:id            - Pay challan
DELETE /api/challans/:id              - Delete challan (police)
```

### Rules & Analytics
```
GET /api/rules/all                    - Get all violation rules
GET /api/analytics/summary            - System analytics
GET /api/analytics/leaderboard        - Citizen rankings
```

### Vehicles
```
GET /api/vehicles/search/:plate_no    - Search vehicle by plate
GET /api/vehicles/citizen/:id         - Get citizen's vehicles
```

---

## 🎯 CRITICAL FEATURES IMPLEMENTED

### 1. Trust Score System (AUTOMATIC)
**How it works:**
- MySQL triggers fire on REPORTS table updates
- `Auto_Reward_System`: +10 trust score when police verifies report
- `Auto_Penalty_System`: -10 trust score when police rejects report (min 0)
- Triggers defined in: `db/database_triggers.sql`
- Install with: `scripts/install_triggers.bat`

**Reflected in:**
- Profile page (profileData.trust_score)
- Leaderboard (sorted by trust_score DESC)
- Analytics dashboard
- Citizen dashboard

### 2. Vehicle-Based Challan System
**Workflow:**
1. Citizen registers with vehicle number (mandatory in Register.jsx)
2. Backend creates VEHICLES record linked to citizen_id
3. Citizen reports violation against violator plate_no
4. Police verifies → redirected to ChallanCreation.jsx
5. Police creates challan → linked to violator's citizen_id via VEHICLES table
6. Violator sees challan in MyChallans.jsx (3-second polling)
7. Violator clicks "Pay Fine" → redirected to PaymentPage.jsx
8. Payment processed → challan marked as "Paid"

**Key files:**
- `frontend/src/pages/Register.jsx` - Vehicle fields added
- `frontend/src/pages/ChallanCreation.jsx` - Police challan form
- `frontend/src/pages/MyChallans.jsx` - Citizen challan viewer
- `frontend/src/pages/PaymentPage.jsx` - Payment + Future Scope
- `server/routes/challans.py` - Challan endpoints

### 3. Real-Time Synchronization
**Implementation:**
```javascript
useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 3000) // 3-second polling
  return () => clearInterval(interval)
}, [])
```

**Pages with real-time updates:**
- MyReports.jsx (citizen)
- MyChallans.jsx (citizen)
- ReviewReports.jsx (police)
- PoliceCommand.jsx
- CitizenDashboard.jsx

### 4. Database Persistence (NEVER FORGETS)
**Guarantees:**
- All data in MySQL `traffic_violation_db`
- Explicit `conn.commit()` after every INSERT/UPDATE/DELETE
- NO auto-wipe commands in codebase
- NO TRUNCATE/DROP TABLE commands
- Data survives server restarts

**Verification:**
```bash
python scripts/verify_complete_system.py
```

---

## 🔐 AUTHENTICATION FLOW

### Citizen Registration
```javascript
// frontend/src/pages/Register.jsx
{
  full_name: string,
  email: string,
  phone_no: string,
  password: string,
  confirm_password: string,
  plate_no: string,          // ✅ MANDATORY
  vehicle_type: string,      // ✅ MANDATORY
  vehicle_model: string      // ✅ OPTIONAL
}

// Backend creates:
// 1. CITIZENS record
// 2. VEHICLES record (linked by citizen_id)
```

### Login & JWT
```python
# server/routes/auth.py
# Login returns:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "full_name": "Arun Sharma",
    "email": "arun@email.com",
    "role": "citizen",
    "trust_score": 60
  }
}

# Stored in localStorage:
localStorage.setItem('token', token)
localStorage.setItem('user', JSON.stringify(user))
```

---

## 🚀 SETUP & RUN COMMANDS

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0
- Git

### Database Setup
```bash
# 1. Create database and schema
mysql -u root -p < db/schema.sql

# 2. Run migrations
cd scripts
migrate_vehicle_citizen_link.bat
install_triggers.bat

# 3. Verify
python verify_complete_system.py
```

### Backend Setup
```bash
cd server

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: https://margarakshak-backend.onrender.com
- API Docs: https://margarakshak-backend.onrender.com/docs

---

## 🧪 TESTING WORKFLOW

### Complete Test Scenario
```
1. Register Citizen A (Arun) with vehicle TN01AB1234
2. Register Citizen B (Priya) with vehicle TN02XY5678
3. Login as Arun → Submit report against TN02XY5678
4. Login as Police (ravi.kumar@police.gov.in / police123)
5. Review Reports → Click "Verify Report"
6. ChallanCreation page opens → Select rule → Issue challan
7. Login as Priya → My Challans → See challan (within 3s)
8. Click "Pay Fine" → Payment page → Pay Now → Success
9. Check Arun's trust score: Should be 60 (+10 from default 50)
10. Submit another report as Arun → Police rejects
11. Check Arun's trust score: Should be 50 (-10)
12. Restart servers → All data still there ✅
```

---

## 📁 IMPORTANT FILE PATHS (FOR AI REFERENCE)

### Backend Core Files
```
server/main.py                    # FastAPI app, CORS, route includes
server/routes/auth.py             # Citizen/Police registration & login
server/routes/reports.py          # Report CRUD + police processing
server/routes/challans.py         # Challan creation & payment
server/routes/analytics.py        # Analytics & leaderboard
server/database.py                # DB connection pool
```

### Frontend Core Files
```
frontend/src/App.jsx                          # Router, all routes
frontend/src/components/Navbar.jsx            # Navigation (role-based)
frontend/src/pages/Register.jsx               # Registration + vehicle
frontend/src/pages/MyChallans.jsx             # Citizen challans
frontend/src/pages/PaymentPage.jsx            # Payment + future scope
frontend/src/pages/ChallanCreation.jsx        # Police challan form
frontend/src/pages/ReviewReports.jsx          # Police review
frontend/src/pages/Profile.jsx                # Trust score display
frontend/src/pages/Leaderboard.jsx            # Rankings
frontend/src/pages/MyReports.jsx              # Citizen reports
```

### Database Files
```
db/schema.sql                     # Complete schema
db/database_triggers.sql          # Trust score triggers
db/add_vehicle_citizen_link.sql   # Vehicle-citizen migration
```

### Scripts
```
scripts/install_triggers.bat              # Install triggers
scripts/migrate_vehicle_citizen_link.bat  # Run migration
scripts/verify_complete_system.py         # System verification
```

---

## ⚠️ CRITICAL NOTES FOR AI ASSISTANTS

### 1. Database Connection
```python
# ALL backend files use this config:
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}
```

### 2. Always Use conn.commit()
```python
# After EVERY INSERT/UPDATE/DELETE:
cursor.execute("INSERT INTO ...")
conn.commit()  # ✅ CRITICAL - Without this, data is lost!
```

### 3. Trust Score Triggers
- Triggers are in MySQL database, NOT in Python code
- They fire automatically when REPORTS.status changes
- No manual trust score updates needed in Python

### 4. Vehicle-Citizen Link
- VEHICLES.citizen_id is a foreign key to CITIZENS.citizen_id
- This link is used to route challans to correct citizen
- Migration must be run before system works

### 5. Real-Time Polling
- All dashboards use 3-second setInterval
- No WebSockets or Server-Sent Events
- Simple polling from MySQL (no caching)

### 6. JWT Authentication
- Token stored in localStorage
- Sent in headers: `Authorization: Bearer <token>`
- User object also in localStorage with role, id, trust_score

### 7. Backend is Python FastAPI (NOT Node.js)
- OLD backend/ folder is deprecated
- Use server/ folder only
- Port 5000 (not 8000 or 3000)

---

## 🎨 UI/UX PATTERNS

### Component Structure
```jsx
function PageName() {
  const [state, setState] = useState(initialValue)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchData = async () => {
    const res = await fetch('https://margarakshak-backend.onrender.com/api/...')
    const data = await res.json()
    setState(data)
    setLoading(false)
  }
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 pt-36">
      {/* Page content */}
    </div>
  )
}
```

### Styling
- TailwindCSS utility classes
- Rounded corners: `rounded-2xl`, `rounded-lg`
- Shadows: `shadow-lg`, `shadow-xl`
- Gradients: `bg-gradient-to-r from-blue-600 to-indigo-600`
- Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

---

## 📊 CURRENT SYSTEM STATUS

✅ **Trust Score System:** Working (MySQL triggers)  
✅ **Challan System:** Working (vehicle-based routing)  
✅ **Payment Page:** Working (with future scope section)  
✅ **Database Persistence:** Guaranteed (MySQL + commit)  
✅ **Real-Time Sync:** Working (3-second polling)  
✅ **Authentication:** Working (JWT + bcrypt)  
✅ **Role-Based Access:** Working (citizen vs police)  

---

## 🔧 COMMON TASKS & HOW TO DO THEM

### Add New API Endpoint
1. Create/edit file in `server/routes/`
2. Add router with `@router.get/post/put/delete`
3. Import in `server/main.py`: `from routes import new_module`
4. Add to app: `app.include_router(new_module.router, prefix="/api/new", tags=["New"])`

### Add New Frontend Page
1. Create file in `frontend/src/pages/NewPage.jsx`
2. Import in `frontend/src/App.jsx`
3. Add route: `<Route path="/new" element={<NewPage />} />`
4. Add to Navbar.jsx navItems array

### Modify Database Schema
1. Edit `db/schema.sql` (for reference)
2. Create migration script in `db/` folder
3. Create `.bat` script in `scripts/` to run migration
4. Run migration before testing

### Add New Database Table
1. Add CREATE TABLE to `db/schema.sql`
2. Create migration: `ALTER TABLE ...` or `CREATE TABLE ...`
3. Run migration
4. Update backend routes to use new table
5. Update frontend to display new data

---

## 📞 QUICK REFERENCE

### Database Credentials
```
Host: 127.0.0.1
User: root
Password: yvpandi@11
Database: traffic_violation_db
Port: 3306
```

### Default Test Accounts
```
Police:
  Email: ravi.kumar@police.gov.in
  Password: police123
  Badge: POL-101

Citizens: Register via /register page
```

### Ports
```
Frontend: 5173
Backend: 5000
MySQL: 3306
```

### Key URLs
```
Frontend: http://localhost:5173
Backend API: https://margarakshak-backend.onrender.com
API Docs: https://margarakshak-backend.onrender.com/docs
```

---

## 🎓 DBMS CONCEPTS DEMONSTRATED

✅ **ACID Transactions** (commit/rollback)  
✅ **Foreign Keys** (referential integrity)  
✅ **Triggers** (automated trust score updates)  
✅ **Indexes** (query optimization)  
✅ **Normalization** (5NF)  
✅ **Temporal Data** (valid_from, valid_to)  
✅ **Audit Trails** (HISTORY tables)  
✅ **Stored Procedures** (optional, currently using direct SQL)  
✅ **Views** (complex joins)  
✅ **Constraints** (CHECK, UNIQUE, NOT NULL)  

---

**END OF PROJECT CONTEXT**

This document contains everything an AI needs to understand and continue working on this project. Paste this entire document when asking for help, and reference specific sections as needed.
