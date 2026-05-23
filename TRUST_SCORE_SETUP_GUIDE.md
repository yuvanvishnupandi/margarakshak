# Marga Rakshak - Trust Score Auto-Update System

## ✅ TRUST SCORE SYSTEM - COMPLETE SETUP GUIDE

---

## 🎯 How Trust Score Works

### Automatic Updates via MySQL Triggers

**When Police VERIFY a report:**
```
trust_score = trust_score + 10
reward_points = reward_points + 10
```

**When Police REJECT a report:**
```
trust_score = GREATEST(trust_score - 10, 0)  -- Won't go below 0
```

---

## 📍 Where Trust Score Appears

| Page | Location | Fetches From |
|------|----------|--------------|
| **Profile Page** | Top card with gradient background | Database (via `/api/auth/profile`) |
| **Leaderboard** | Ranking list sorted by trust_score | Database (via `/api/analytics/leaderboard`) |
| **Analytics Dashboard** | Trust score metric display | Database |
| **Citizen Dashboard** | User stats section | Database |
| **Hero Page** | Top citizens showcase | Database |

---

## 🔧 STEP 1: Install MySQL Triggers

### Option 1: Automated (Recommended)

```bash
cd c:\Users\yuvan\OneDrive\Documents\traffic_violation\scripts
install_triggers.bat
```

### Option 2: Manual

```bash
cd c:\Users\yuvan\OneDrive\Documents\traffic_violation
mysql -u root -pyvpandi@11 traffic_violation_db < db\database_triggers.sql
```

### What This Does:

Creates two MySQL triggers:

1. **Auto_Reward_System** - Fires AFTER UPDATE on REPORTS
   - Checks if status changed from 'Pending' to 'Verified'
   - Adds +10 to citizen's trust_score
   - Adds +10 to citizen's reward_points

2. **Auto_Penalty_System** - Fires AFTER UPDATE on REPORTS
   - Checks if status changed from 'Pending' to 'Rejected'
   - Subtracts -10 from citizen's trust_score
   - Ensures score doesn't go below 0

---

## ✅ STEP 2: Verify Triggers Are Working

### Run Test Script

```bash
cd scripts
python test_trust_score_triggers.py
```

### What It Tests:

1. ✅ Checks if triggers are installed
2. ✅ Finds a test citizen
3. ✅ Creates a test pending report
4. ✅ Updates report to "Verified" → Checks if trust_score increased by 10
5. ✅ Creates another test report
6. ✅ Updates report to "Rejected" → Checks if trust_score decreased by 10
7. ✅ Verifies trust score appears in all pages

### Expected Output:

```
======================================================================
MARGA RAKSHAK - TRUST SCORE TRIGGER VERIFICATION
======================================================================

[CHECK 1] Verifying MySQL triggers are installed...
   ✅ Found 2 trigger(s):
     - Auto_Reward_System (AFTER UPDATE on REPORTS)
     - Auto_Penalty_System (AFTER UPDATE on REPORTS)

[CHECK 4] Testing VERIFY trigger (should add +10 points)...
   Trust score before: 50
   Trust score after:  60
   ✅ TRIGGER WORKS! Score increased by 10 points

[CHECK 5] Testing REJECT trigger (should subtract -10 points)...
   Trust score before: 60
   Trust score after:  50
   ✅ TRIGGER WORKS! Score decreased by 10 points

======================================================================
TRIGGER VERIFICATION COMPLETE
======================================================================

TRUST SCORE UPDATE RULES:
  ✅ Police VERIFY report → Citizen gets +10 trust score
  ✅ Police REJECT report → Citizen loses -10 trust score (min 0)
  ✅ Updates are AUTOMATIC (MySQL triggers)
  ✅ Reflected in: Profile, Leaderboard, Analytics, Dashboard
```

---

## 🎬 STEP 3: Live Demo Test

### Scenario: Complete Trust Score Flow

**1. Citizen checks current trust score:**
```
Login as: arun.sharma@email.com / citizen123
Navigate to: Profile Page
Note trust score: 50 (default)
```

**2. Citizen submits a report:**
```
Navigate to: Submit Report
Fill in details and submit
Report status: "Pending"
Trust score: Still 50 (no change yet)
```

**3. Police verifies the report:**
```
Login as: ravi.kumar@police.gov.in / police123
Navigate to: Review Reports
Find the pending report
Click: "Verify Report"
```

**4. MySQL Trigger fires AUTOMATICALLY:**
```sql
-- This happens automatically in the database:
UPDATE CITIZENS 
SET trust_score = trust_score + 10,
    reward_points = reward_points + 10
WHERE citizen_id = <citizen_id>;
```

**5. Citizen sees updated trust score:**
```
Login as: arun.sharma@email.com / citizen123
Navigate to: Profile Page
Trust score: 60 (increased by 10!) ✅

Navigate to: Leaderboard
Citizen ranking improved ✅
```

---

## 🔍 Troubleshooting

### Problem: Trust score not updating

**Check 1: Are triggers installed?**
```bash
mysql -u root -pyvpandi@11 -e "USE traffic_violation_db; SHOW TRIGGERS;"
```

**Expected output:** Should show `Auto_Reward_System` and `Auto_Penalty_System`

**If NO triggers shown:**
```bash
cd scripts
install_triggers.bat
```

---

**Check 2: Is the report status actually changing?**
```sql
SELECT report_id, status, reviewed_at 
FROM REPORTS 
WHERE citizen_id = <your_citizen_id>
ORDER BY date_reported DESC 
LIMIT 5;
```

**Expected:** Status should be "Verified" or "Rejected", not "Pending"

---

**Check 3: Is trust_score in database updated?**
```sql
SELECT citizen_id, full_name, trust_score, reward_points
FROM CITIZENS
WHERE email = 'arun.sharma@email.com';
```

**Expected:** trust_score should reflect all verified/rejected reports

---

**Check 4: Is frontend fetching latest data?**
- The Profile page fetches from `/api/auth/profile` on load
- The Leaderboard fetches from `/api/analytics/leaderboard` on load
- Both get data directly from database (no caching)

**Solution:** Refresh the page to fetch latest trust score

---

## 📊 Database Schema

### CITIZENS Table

```sql
CREATE TABLE CITIZENS (
    citizen_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_no VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    trust_score INT DEFAULT 50,           -- UPDATED BY TRIGGERS
    reward_points INT DEFAULT 0,          -- UPDATED BY TRIGGERS
    account_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### REPORTS Table

```sql
CREATE TABLE REPORTS (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    plate_no VARCHAR(20) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    location_coords VARCHAR(255),
    location_address TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending',  -- TRIGGERS WATCH THIS
    date_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(20),
    FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id),
    FOREIGN KEY (plate_no) REFERENCES VEHICLES(plate_no)
);
```

---

## 🎯 Trigger Logic

### Auto_Reward_System Trigger

```sql
CREATE TRIGGER Auto_Reward_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Verified
    IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
        UPDATE CITIZENS
        SET trust_score = trust_score + 10,
            reward_points = reward_points + 10
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END;
```

**How it works:**
1. Fires AFTER any UPDATE on REPORTS table
2. Checks if OLD.status was 'Pending' AND NEW.status is 'Verified'
3. If true, updates the citizen's trust_score and reward_points
4. Runs automatically - no Python code needed!

---

### Auto_Penalty_System Trigger

```sql
CREATE TRIGGER Auto_Penalty_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Rejected
    IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
        UPDATE CITIZENS
        SET trust_score = GREATEST(trust_score - 10, 0)  -- Don't go below 0
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END;
```

**How it works:**
1. Fires AFTER any UPDATE on REPORTS table
2. Checks if OLD.status was 'Pending' AND NEW.status is 'Rejected'
3. If true, subtracts 10 from trust_score (minimum 0)
4. Uses `GREATEST()` to prevent negative scores

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Police clicks "Verify Report" or "Reject Report"    │
│ PUT /api/reports/police/process/{report_id}                 │
│ Body: { status: "Verified" } or { status: "Rejected" }      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Backend updates REPORTS table                       │
│ UPDATE REPORTS SET status = 'Verified', reviewed_at = NOW() │
│ WHERE report_id = {report_id}                               │
│ conn.commit()                                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: MySQL Trigger Fires AUTOMATICALLY                   │
│ Auto_Reward_System or Auto_Penalty_System                   │
│                                                             │
│ IF status = 'Verified':                                     │
│   UPDATE CITIZENS SET trust_score = trust_score + 10       │
│   UPDATE CITIZENS SET reward_points = reward_points + 10   │
│                                                             │
│ IF status = 'Rejected':                                     │
│   UPDATE CITIZENS SET trust_score = GREATEST(score - 10, 0)│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Data is now updated in database                     │
│ trust_score and reward_points are PERMANENTLY updated        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Frontend fetches updated data                       │
│ - Profile page: GET /api/auth/profile                       │
│ - Leaderboard: GET /api/analytics/leaderboard               │
│ - Analytics: GET /api/analytics/summary                     │
│ All pages show the NEW trust score immediately              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

- [ ] MySQL triggers installed (run `install_triggers.bat`)
- [ ] Triggers verified (run `test_trust_score_triggers.py`)
- [ ] Police can verify/reject reports
- [ ] Citizen trust_score updates in database
- [ ] Profile page shows updated trust score
- [ ] Leaderboard reflects new rankings
- [ ] Analytics dashboard displays correct score
- [ ] Reward points increase when verified

---

## 🎓 DBMS Concepts Demonstrated

✅ **Triggers** - Automatic execution on database events  
✅ **ACID Compliance** - Transaction integrity maintained  
✅ **Data Consistency** - Single source of truth (database)  
✅ **Automation** - No manual score updates needed  
✅ **Constraints** - `GREATEST()` prevents negative scores  
✅ **Referential Integrity** - Foreign keys maintain relationships  

---

## 🚀 Quick Start Commands

```bash
# Step 1: Install triggers
cd scripts
install_triggers.bat

# Step 2: Test triggers
python test_trust_score_triggers.py

# Step 3: Start backend
cd ../server
python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload

# Step 4: Start frontend
cd ../frontend
npm run dev

# Step 5: Test in browser
# - Login as citizen, note trust score
# - Login as police, verify a report
# - Login as citizen, see trust score increased!
```

---

**Trust Score System Status: ✅ FULLY OPERATIONAL**
