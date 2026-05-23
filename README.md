<<<<<<< HEAD
# Traffic Violation Management System

**Tier-1 Government/Law Enforcement Portal with Biometric Authentication**

A production-ready, academically rigorous DBMS capstone project featuring:
- 5NF normalized MySQL database with temporal versioning
- Python FastAPI backend with OpenCV DNN face recognition
- React + Vite frontend with webcam integration
- Row-level locking for concurrent payment processing
- PL/SQL triggers, procedures, cursors, and views

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  • Vite + React 18 + Tailwind CSS                       │
│  • Webcam face capture (navigator.mediaDevices)         │
│  • Citizen Dashboard + Police Command Center            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (FastAPI)                       │
│  • Python 3.10+ with async support                      │
│  • OpenCV DNN face detection (ResNet-34 Caffe)          │
│  • JWT authentication + bcrypt password hashing         │
│  • MySQL connection pooling                             │
└────────────────────┬────────────────────────────────────┘
                     │ MySQL Protocol
┌────────────────────▼────────────────────────────────────┐
│               DATABASE (MySQL 8.0+)                      │
│  • 5NF normalized schema (16 tables)                    │
│  • Temporal tables (valid_from/valid_to)                │
│  • PL/SQL triggers (trust score automation)             │
│  • Stored procedures (challan generation, payment)      │
│  • Views (pending reports, performance stats)           │
│  • Cursors (overdue challan flagging)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
traffic_violation/
├── db/
│   └── schema.sql                    # Complete database schema (942 lines)
├── server/                           # Python FastAPI Backend
│   ├── main.py                       # Application entry point
│   ├── config.py                     # Configuration management
│   ├── database.py                   # MySQL connection pool
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables
│   ├── routes/
│   │   ├── auth.py                   # Registration, login, face biometrics
│   │   ├── face_recognition.py       # Face detection endpoints
│   │   ├── reports.py                # Violation report submission
│   │   ├── police.py                 # Police command endpoints
│   │   ├── challans.py               # Challan payment with row-locking
│   │   └── trust.py                  # Trust score history
│   ├── services/
│   │   └── face_service.py           # OpenCV DNN face recognition
│   ├── middleware/
│   │   └── auth.py                   # JWT authentication
│   ├── models/                       # OpenCV DNN model files
│   │   ├── deploy.prototxt           # [DOWNLOAD REQUIRED]
│   │   └── res10_300x300_ssd_iter_140000.caffemodel  # [DOWNLOAD REQUIRED]
│   └── uploads/                      # Evidence photos storage
├── frontend/                         # React Vite Frontend
│   ├── src/
│   │   ├── App.jsx                   # Main app with routing
│   │   ├── config.js                 # API endpoints configuration
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Email/password + face login
│   │   │   ├── Register.jsx          # Registration + face enrollment
│   │   │   ├── CitizenDashboard.jsx  # Trust score, reports, challans
│   │   │   └── PoliceCommand.jsx     # Pending reports dashboard
│   │   └── components/
│   │       ├── FaceCapture.jsx       # Webcam face capture component
│   │       ├── StatusBadge.jsx       # Status indicator badges
│   │       ├── TrustScoreChart.jsx   # Trust score visualization
│   │       ├── DataTable.jsx         # Data table component
│   │       ├── PaymentModal.jsx      # Payment modal
│   │       └── Navbar.jsx            # Navigation bar
│   ├── vite.config.js                # Vite configuration with proxy
│   └── tailwind.config.js            # Tailwind CSS configuration
├── backend/                          # [DEPRECATED] Node.js backend (kept for reference)
└── scripts/
    └── setup_db.bat                  # Windows database setup script
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** (for FastAPI backend)
- **Node.js 18+** (for React frontend)
- **MySQL 8.0+** (database server)
- **Webcam** (for face recognition)

---

### Step 1: Database Setup

```bash
# Windows
cd scripts
setup_db.bat

# Manual (if script fails)
mysql -u root -p < db/schema.sql
```

**What this creates:**
- 16 tables (core, history, transient)
- 5 triggers (trust score automation, temporal versioning)
- 4 stored procedures (challan generation, payment, rejection, overdue flagging)
- 4 views (pending reports, challan summary, performance, trust history)
- Seed data (5 citizens, 3 officers, 12 violation rules, 6 vehicles)

---

### Step 2: Backend Setup

```bash
cd server

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Download OpenCV DNN models
cd models
# Follow instructions in README.txt to download:
# - deploy.prototxt
# - res10_300x300_ssd_iter_140000.caffemodel
cd ..

# Configure environment
# Edit .env file with your MySQL credentials

# Start backend server
python main.py
```

Backend will run at: **http://localhost:5000**  
API Docs: **http://localhost:5000/docs** (Swagger UI)

---

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: **http://localhost:5173**

---

## 🔐 Default Credentials

### Citizens (password: `password123`)
- aarav@example.com (Trust Score: 75)
- priya@example.com (Trust Score: 50)
- rohan@example.com (Trust Score: 30)
- sneha@example.com (Trust Score: 90)
- vikram@example.com (Trust Score: 10, Suspended)

### Police (password: `police123`)
- rajesh@police.gov (Badge: TN-4521, Inspector)
- lakshmi@police.gov (Badge: TN-3310, Sub-Inspector)
- deepak@police.gov (Badge: TN-7788, Asst Sub-Inspector)

---

## 🎯 Key Features

### 1. Biometric Authentication
- **Face Registration**: Citizens can register their face during signup
- **Face Login**: Login using webcam instead of password
- **OpenCV DNN**: Uses ResNet-34 Caffe model for face detection
- **Fallback**: Traditional email/password login always available

### 2. Database Architecture
- **5NF Normalization**: Zero redundancy, maximum integrity
- **Temporal Tables**: Track historical changes (valid_from/valid_to)
- **Transient Tables**: Auto-purge sessions and unlinked uploads
- **Triggers**: Automatic trust score adjustment on report verification/rejection
- **Stored Procedures**: ACID-compliant challan generation and payment
- **Row-Level Locking**: Prevents double-payment race conditions
- **Cursors**: Iterate overdue challans and apply penalties
- **Views**: Pre-computed dashboards for police and citizens

### 3. Citizen Dashboard
- **Trust Score**: Real-time score with temporal history chart
- **Submit Reports**: Upload violation evidence with GPS coordinates
- **View Challans**: See issued fines and pay online
- **Payment Portal**: Secure payment with transaction reference

### 4. Police Command Center
- **Pending Reports**: Dashboard view of unverified reports
- **Verify/Reject**: Process reports with rule selection
- **Performance Stats**: Track verification rates and revenue
- **Overdue Flagging**: Manually trigger overdue challan penalties

---

## 📊 Database Features

### Temporal Implementation
```sql
-- Every UPDATE on CITIZENS creates a history row
UPDATE CITIZENS SET trust_score = 60 WHERE citizen_id = 1;
-- Old row preserved in CITIZENS_HISTORY with valid_to timestamp
```

### Trust Score Triggers
```sql
-- AFTER UPDATE on REPORTS
IF status = 'Verified' THEN
  UPDATE CITIZENS SET trust_score = trust_score + 10;
ELSEIF status = 'Rejected' THEN
  UPDATE CITIZENS SET trust_score = trust_score - 10;
END IF;
```

### Concurrency Control
```sql
-- Row-level locking prevents double payment
START TRANSACTION;
SELECT * FROM CHALLANS WHERE challan_id = 1 FOR UPDATE;
UPDATE CHALLANS SET payment_status = 'Paid' WHERE challan_id = 1;
COMMIT;
```

---

## 🧪 Testing

### Backend API Testing
Use Swagger UI at **http://localhost:5000/docs** or test with curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aarav@example.com","password":"password123","role":"citizen"}'

# Get my reports (replace TOKEN with actual JWT)
curl http://localhost:5000/api/reports/my \
  -H "Authorization: Bearer TOKEN"
```

### Frontend Manual Testing Checklist
- [ ] Register new citizen account
- [ ] Register face during signup
- [ ] Login with face recognition
- [ ] Login with email/password
- [ ] Submit violation report with image upload
- [ ] View trust score history chart
- [ ] Pay challan (test row-level locking)
- [ ] Police: Verify report and issue challan
- [ ] Police: Reject report with reason
- [ ] Police: View performance statistics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Database** | MySQL 8.0+, mysql-connector-python |
| **ML/Biometrics** | OpenCV DNN (ResNet-34 Caffe), NumPy |
| **Authentication** | JWT (python-jose), bcrypt (passlib) |
| **Styling** | Tailwind CSS (government theme) |

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register citizen
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register_face` - Register face encoding
- `POST /api/auth/login_face` - Face-based login
- `GET /api/auth/profile` - Get current user profile

### Reports
- `POST /api/reports` - Submit violation report (multipart)
- `GET /api/reports/my` - Get citizen's reports
- `GET /api/reports/{id}` - Get report details

### Police
- `GET /api/police/pending` - Fetch pending reports view
- `POST /api/police/verify/{id}` - Verify report + issue challan
- `POST /api/police/reject/{id}` - Reject report
- `GET /api/police/rules` - Get violation rules
- `GET /api/police/performance` - Get officer stats

### Challans
- `GET /api/challans/my` - Get citizen's challans
- `POST /api/challans/pay` - Pay challan (row-locked)
- `GET /api/challans/{id}` - Get challan details
- `GET /api/challans/history/{id}` - Get temporal audit trail

### Trust & History
- `GET /api/trust/history/{id}` - Get trust score history
- `GET /api/trust/current/{id}` - Get current trust score
- `POST /api/trust/flag-overdue` - Flag overdue challans

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with automatic salt generation
- **JWT Tokens**: 8-hour expiry with role-based access control
- **Row-Level Locking**: Prevents race conditions in payments
- **Input Validation**: FastAPI Pydantic models for all endpoints
- **SQL Injection Protection**: Parameterized queries via mysql-connector
- **CORS Configuration**: Restricted to frontend origins
- **Face Encoding Storage**: Encrypted BLOB in database

---

## 🎓 Academic Features (For Capstone Evaluation)

### Database Normalization
- **1NF**: Atomic values, no repeating groups
- **2NF**: No partial dependencies
- **3NF**: No transitive dependencies
- **BCNF**: Every determinant is a candidate key
- **4NF**: No multi-valued dependencies
- **5NF**: No join dependencies

### Advanced SQL
- **Triggers**: 5 automated triggers for business logic
- **Stored Procedures**: 4 procedures with exception handling
- **Cursors**: Iterative processing for overdue challans
- **Views**: 4 pre-computed dashboard views
- **Events**: Scheduled auto-purge for transient data
- **Temporal Tables**: System versioning with valid_from/valid_to

### Concurrency Control
- **ACID Transactions**: All critical operations use transactions
- **Row-Level Locking**: `SELECT ... FOR UPDATE` prevents conflicts
- **Exception Handling**: `DECLARE EXIT HANDLER FOR SQLEXCEPTION`

---

## 🐛 Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql -u root -p`
- Verify `.env` file has correct database credentials
- Ensure all dependencies installed: `pip install -r requirements.txt`

### Face detection not working
- Download OpenCV DNN models (see `server/models/README.txt`)
- Check webcam permissions in browser
- Ensure good lighting when capturing face

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check Vite proxy configuration in `vite.config.js`
- Clear browser cache and reload

### Database errors
- Run `setup_db.bat` to recreate database
- Check MySQL version is 8.0+
- Verify schema.sql executed without errors

---

## 📄 License

This is a capstone academic project for educational purposes.

---

## 👨‍💻 Developer

Built as a Tier-1 Government/Law Enforcement Traffic Violation Management System  
**Tech Stack**: React + FastAPI + MySQL + OpenCV DNN  
**Project Type**: DBMS Capstone / Full-Stack Application

---

## 🙏 Acknowledgments

- OpenCV for DNN face detection models
- FastAPI for high-performance async framework
- MySQL for advanced database features
- React ecosystem for modern frontend development
=======
# Traffic-Violation-Management-System
updating soon...
>>>>>>> 0bb3de486307a045553c1b0705472e4c26d97ebb
