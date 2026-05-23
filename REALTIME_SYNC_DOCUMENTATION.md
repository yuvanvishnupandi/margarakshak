# Marga Rakshak - Real-Time DBMS Synchronization System

## ✅ REAL-TIME SYNC STATUS: FULLY IMPLEMENTED

---

## 🎯 How It Works

### Database as Single Source of Truth

```
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database (REPORTS)                     │
│                                                                 │
│  This is the SINGLE SOURCE OF TRUTH for all data               │
│  - Citizens INSERT reports here                                 │
│  - Citizens UPDATE reports here                                 │
│  - Police SELECT reports from here                              │
│  - Police UPDATE reports here                                   │
│  - ALL changes are IMMEDIATE and PERSISTENT                     │
└─────────────────────────────────────────────────────────────────┘
         ↑                                    ↑
         │                                    │
    3-second polling                    3-second polling
         │                                    │
┌────────┴────────┐                  ┌────────┴────────┐
│  Citizen UI     │                  │   Police UI     │
│  (MyReports)    │                  │ (ReviewReports) │
│                 │                  │                 │
│ Auto-refreshes  │                  │ Auto-refreshes  │
│ every 3 seconds │                  │ every 3 seconds │
└─────────────────┘                  └─────────────────┘
```

---

## 📡 Real-Time Synchronization Flow

### Scenario 1: Citizen Submits Report → Police See It Instantly

```
TIME 0s:   Citizen submits report
           ↓
           POST /api/reports/create
           ↓
           INSERT INTO REPORTS (citizen_id, plate_no, ..., status='Pending')
           ↓
           conn.commit() ✅ (Data is now in database)

TIME 3s:   Police dashboard auto-refreshes
           ↓
           GET /api/reports/police/pending
           ↓
           SELECT * FROM REPORTS WHERE status='Pending'
           ↓
           Report appears on Police screen ✅

RESULT:    Police see the report within 3 seconds of submission
```

---

### Scenario 2: Police Verify/Reject → Citizen Sees Status Instantly

```
TIME 0s:   Police clicks "Verify Report"
           ↓
           PUT /api/reports/police/process/{id}
           ↓
           UPDATE REPORTS SET status='Verified', reviewed_at=NOW()
           ↓
           conn.commit() ✅ (Status updated in database)
           ↓
           MySQL Trigger fires: Auto-update citizen trust score

TIME 3s:   Citizen dashboard auto-refreshes
           ↓
           GET /api/reports/my-reports/{citizen_id}
           ↓
           SELECT * FROM REPORTS WHERE citizen_id=X
           ↓
           Status shows "Verified" instead of "Pending" ✅

RESULT:    Citizen sees status change within 3 seconds
```

---

### Scenario 3: Citizen Edits Report → Police See Changes Instantly

```
TIME 0s:   Citizen edits pending report
           ↓
           PUT /api/reports/update/{id}
           ↓
           UPDATE REPORTS SET plate_no=X, description=Y WHERE report_id=Z
           ↓
           conn.commit() ✅ (Changes saved to database)

TIME 3s:   Police dashboard auto-refreshes
           ↓
           GET /api/reports/police/pending
           ↓
           SELECT * FROM REPORTS WHERE status='Pending'
           ↓
           Updated data appears on Police screen ✅

RESULT:    Police see the updated report within 3 seconds
```

---

## 🔧 Implementation Details

### Frontend: Auto-Refresh Every 3 Seconds

#### Police Review Page ([ReviewReports.jsx](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/frontend/src/pages/ReviewReports.jsx))

```javascript
useEffect(() => {
  fetchPendingReports()
  fetchRules()
  
  // REAL-TIME SYNC: Auto-refresh every 3 seconds
  const interval = setInterval(fetchPendingReports, 3000)
  
  // Cleanup interval on component unmount
  return () => clearInterval(interval)
}, [])
```

**What it does:**
- Fetches pending reports immediately on page load
- Sets up interval to re-fetch every 3000ms (3 seconds)
- Cleans up interval when user leaves the page
- **Result:** Police always see the latest reports from database

---

#### Citizen My Reports Page ([MyReports.jsx](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/frontend/src/pages/MyReports.jsx))

```javascript
useEffect(() => {
  fetchReports()
  
  // REAL-TIME SYNC: Auto-refresh every 3 seconds
  const interval = setInterval(fetchReports, 3000)
  
  // Cleanup interval on component unmount
  return () => clearInterval(interval)
}, [])
```

**What it does:**
- Fetches citizen's reports immediately on page load
- Sets up interval to re-fetch every 3000ms (3 seconds)
- Cleans up interval when user leaves the page
- **Result:** Citizen always sees latest status from database

---

### Backend: Direct Database Queries (No Caching)

#### Citizen Creates Report ([reports.py](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/server/routes/reports.py#L62-L136))

```python
@router.post("/create")
async def create_report(report_data: ReportCreateRequest):
    # ... validation ...
    
    # INSERT directly into database
    cursor.execute(
        """INSERT INTO REPORTS 
           (citizen_id, plate_no, violation_type, location_coords, location_address, 
            description, status, date_reported)
           VALUES (%s, %s, %s, %s, %s, %s, 'Pending', %s)""",
        (report_data.citizen_id, report_data.plate_no, ...)
    )
    
    conn.commit()  # ✅ PERSIST to database immediately
    
    return {"message": "Report created successfully", "report_id": report_id}
```

**Guarantee:** Data is immediately available in database after `conn.commit()`

---

#### Police Fetches Pending Reports ([reports.py](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/server/routes/reports.py#L325-L373))

```python
@router.get("/police/pending")
async def get_pending_reports():
    # Query database directly every time (NO caching)
    cursor.execute(
        """SELECT r.report_id, r.citizen_id, r.plate_no, r.violation_type,
                  r.location_coords, r.location_address,
                  r.description, r.status, r.date_reported as reported_at,
                  c.full_name as reporter_name, 
                  c.email as reporter_email,
                  c.trust_score as reporter_trust_score
           FROM REPORTS r
           JOIN CITIZENS c ON r.citizen_id = c.citizen_id
           WHERE r.status = 'Pending'
           ORDER BY r.date_reported DESC"""
    )
    
    reports = cursor.fetchall()  # ✅ Always returns FRESH data from database
    
    return {"message": "Pending reports fetched", "count": len(reports), "reports": reports}
```

**Guarantee:** Every request gets the latest data from database

---

#### Police Updates Report Status ([reports.py](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/server/routes/reports.py#L376-L423))

```python
@router.put("/police/process/{report_id}")
async def process_report(report_id: int, process_data: PoliceStatusUpdateRequest):
    # ... validation ...
    
    # UPDATE status directly in database
    cursor.execute(
        "UPDATE REPORTS SET status = %s, reviewed_at = NOW() WHERE report_id = %s",
        (process_data.status, report_id)
    )
    
    conn.commit()  # ✅ PERSIST changes immediately
    
    return {"message": f"Report {report_id} status updated to {process_data.status}"}
```

**Guarantee:** Status change is immediately available in database

---

#### Citizen Updates Report ([reports.py](file:///c:/Users/yuvan/OneDrive/Documents/traffic_violation/server/routes/reports.py#L188-L268))

```python
@router.put("/update/{report_id}")
async def update_report(report_id: int, update_data: ReportUpdateRequest):
    # ... validation ...
    
    # UPDATE report fields directly in database
    query = f"UPDATE REPORTS SET {', '.join(update_fields)} WHERE report_id = %s"
    cursor.execute(query, update_values)
    
    conn.commit()  # ✅ PERSIST changes immediately
    
    return {"message": "Report updated successfully"}
```

**Guarantee:** Updates are immediately available in database

---

## 🔄 Complete Synchronization Matrix

| Action | Database Operation | Police See It | Citizen Sees It |
|--------|-------------------|---------------|-----------------|
| Citizen submits report | `INSERT INTO REPORTS ... status='Pending'` | ✅ Within 3s | ✅ Immediately |
| Citizen edits report | `UPDATE REPORTS SET ...` | ✅ Within 3s | ✅ Immediately |
| Police verifies report | `UPDATE REPORTS SET status='Verified'` | ✅ Immediately | ✅ Within 3s |
| Police rejects report | `UPDATE REPORTS SET status='Rejected'` | ✅ Immediately | ✅ Within 3s |
| MySQL trigger fires | `UPDATE CITIZENS SET trust_score=...` | N/A | ✅ On next refresh |

---

## 🎓 DBMS Concepts Demonstrated

### 1. **Single Source of Truth**
- ✅ All data stored in centralized MySQL database
- ✅ No client-side state management for critical data
- ✅ Every query hits the database directly

### 2. **ACID Compliance**
- ✅ **Atomicity:** All INSERT/UPDATE operations use `conn.commit()`
- ✅ **Consistency:** Foreign keys and constraints enforced
- ✅ **Isolation:** Each query gets fresh data (no caching)
- ✅ **Durability:** Committed transactions persist to disk

### 3. **Real-Time Data Consistency**
- ✅ No stale data - every fetch queries the database
- ✅ Automatic polling ensures UI reflects database state
- ✅ All users see the same data from the same source

### 4. **Transaction Management**
- ✅ `conn.commit()` after every successful operation
- ✅ `conn.rollback()` on errors to maintain consistency
- ✅ Proper connection handling with `finally` blocks

### 5. **Triggers for Automation**
- ✅ `Auto_Reward_System` trigger fires on status='Verified'
- ✅ `Auto_Penalty_System` trigger fires on status='Rejected'
- ✅ Trust scores update automatically without manual intervention

---

## 🚀 Testing the Real-Time Sync

### Test 1: Citizen → Police Sync

1. **Open 2 browsers side by side**
2. **Browser 1 (Police):** Login and navigate to "Review Reports"
3. **Browser 2 (Citizen):** Login and navigate to "Submit Report"
4. **Submit a report** as citizen
5. **Watch Police browser** - within 3 seconds, the report appears!
6. **Database proof:** `SELECT * FROM REPORTS ORDER BY date_reported DESC LIMIT 1;`

---

### Test 2: Police → Citizen Sync

1. **Open 2 browsers side by side**
2. **Browser 1 (Citizen):** Login and navigate to "My Reports"
3. **Browser 2 (Police):** Login and navigate to "Review Reports"
4. **Click "Verify Report"** on Police browser
5. **Watch Citizen browser** - within 3 seconds, status changes to "Verified"!
6. **Database proof:** `SELECT status FROM REPORTS WHERE report_id=X;`

---

### Test 3: Citizen Edit → Police Sync

1. **Open 2 browsers side by side**
2. **Browser 1 (Police):** Login and navigate to "Review Reports"
3. **Browser 2 (Citizen):** Login and navigate to "My Reports"
4. **Click "Edit"** on a Pending report, change description, save
5. **Watch Police browser** - within 3 seconds, updated description appears!
6. **Database proof:** `SELECT description FROM REPORTS WHERE report_id=X;`

---

## 📊 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Sync Latency** | ≤3 seconds | Polling interval |
| **Database Queries** | 20 queries/min per user | 60s / 3s = 20 |
| **Network Overhead** | Minimal | JSON responses ~1-5KB |
| **CPU Usage** | Low | Simple SELECT queries |
| **Memory Usage** | Low | No caching, no state |
| **Scalability** | High | Database handles concurrent reads |

---

## ✅ Guarantees

### What IS Guaranteed:

✅ **Every citizen report reaches EVERY police officer**  
- All police query the same `REPORTS` table
- No per-officer filtering - everyone sees all pending reports

✅ **Police actions reflect to citizens within 3 seconds**  
- Status updates committed to database immediately
- Citizen UI polls database every 3 seconds

✅ **Citizen edits reflect to police within 3 seconds**  
- Updates committed to database immediately
- Police UI polls database every 3 seconds

✅ **Data is always accurate and from real database**  
- No caching, no localStorage for report data
- Every fetch executes fresh SQL query

✅ **Database is the single source of truth**  
- All state comes from MySQL
- Frontend is just a view layer

---

### What is NOT Guaranteed:

❌ **Instant sync (<1 second)** - Polling interval is 3 seconds  
❌ **WebSockets/Push notifications** - Using HTTP polling instead  
❌ **Offline support** - Requires database connection  

---

## 🎯 For Your DBMS Presentation

**Say this during your demo:**

> "Our system uses MySQL as the single source of truth with automatic polling every 3 seconds. When a citizen submits a report, it's immediately committed to the database using `conn.commit()`. Within 3 seconds, all police officers see the report because their dashboard queries the database directly with `SELECT * FROM REPORTS WHERE status='Pending'`. When police verify or reject, the status updates in the database, and the citizen sees the change within 3 seconds through automatic polling. This ensures **real-time data consistency** across all users with **ACID-compliant transactions**."

---

**System Status: ✅ REAL-TIME DBMS SYNC FULLY OPERATIONAL**
