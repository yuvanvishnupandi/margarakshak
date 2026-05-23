# Traffic Reports Feature - Complete Implementation Guide

## Overview
This document describes the complete implementation of the Traffic Reports feature with Role-Based Access Control (RBAC), including database schema enhancements, mock data, and secure API routes.

---

## PART 1: Database Schema Enhancement

### SQL Migration Script
**File:** `db/reports_enhancement.sql`

#### New Columns Added to REPORTS Table:

1. **`violation_type`** (VARCHAR(100))
   - Stores the type of violation (e.g., "Speeding", "Red Light Violation")
   - Added after `plate_no` column

2. **`latitude`** (DECIMAL(10, 8))
   - Precise GPS latitude coordinate
   - Nullable for backward compatibility

3. **`longitude`** (DECIMAL(11, 8))
   - Precise GPS longitude coordinate
   - Nullable for backward compatibility

4. **`fine_amount`** (DECIMAL(10, 2))
   - Stores the fine amount when challan is issued
   - Default: 0.00

5. **Enhanced `status` ENUM**
   - Old: `('Pending', 'Verified', 'Rejected')`
   - New: `('Pending', 'Verified', 'Rejected', 'Challan Issued')`

#### New Indexes:
- `idx_report_violation_type` - Fast filtering by violation type
- `idx_report_location` - Spatial queries on lat/lng
- `idx_report_fine` - Financial reporting queries

---

## PART 2: Mock Data (8 Realistic Records)

### Distribution:
- **4 Pending** - No fine, no officer assigned
- **2 Verified** - Assigned to officer TN-4521
- **1 Challan Issued** - ₹10,000 fine for drunk driving
- **1 Rejected** - Insufficient evidence

### Real Chennai Locations Used:
1. Anna Salai, T. Nagar
2. OMR Sholinganallur Signal
3. ECR Road, Neelankarai
4. Mount Road, Guindy
5. Velachery Main Road
6. Express Avenue, Royapettah
7. GST Road, Chrompet
8. Pondy Bazaar, T. Nagar

### Violation Types:
- Speeding
- Red Light Violation
- No Helmet
- Wrong-Side Driving
- Overloading
- Using Phone While Driving
- Drunk Driving (₹10,000 fine)
- Unnecessary Honking

---

## PART 3: Citizen API Routes (RBAC Enforced)

### 3.1 POST `/api/reports/citizen/submit`
**Access:** Citizens only (enforced by `require_citizen` dependency)

**Request Type:** `multipart/form-data`

**Parameters:**
- `plate_no` (string, required) - Vehicle number
- `violation_type` (string, required) - Type of violation
- `location_coords` (string, optional) - GPS coordinates as "lat,lng"
- `location_address` (string, optional) - Human-readable address
- `latitude` (float, optional) - GPS latitude
- `longitude` (float, optional) - GPS longitude
- `description` (string, required) - Detailed description
- `evidence_image` (file, optional) - JPEG/PNG image upload

**Response:**
```json
{
  "message": "Report submitted successfully",
  "report_id": 123,
  "status": "Pending"
}
```

**Security:**
- Requires valid JWT token with `role: "citizen"`
- Automatically sets `citizen_id` from token payload
- Sets initial status to "Pending"
- Sets `fine_amount` to 0.00

---

### 3.2 PUT `/api/reports/citizen/{report_id}`
**Access:** Citizens only

**Request Type:** `application/json`

**Request Body:**
```json
{
  "plate_no": "TN-01-AB-1234",
  "location_address": "Updated address",
  "description": "Updated description"
}
```

**RBAC Rule:** 
- **403 Forbidden** if status is NOT 'Pending'
- Citizens can only modify their own reports
- Checks ownership via `citizen_id` match

**Response (Success):**
```json
{
  "message": "Report updated successfully",
  "report_id": 123
}
```

**Response (Forbidden):**
```json
{
  "detail": "Cannot update report with status 'Verified'. Only 'Pending' reports can be modified."
}
```

---

### 3.3 DELETE `/api/reports/citizen/{report_id}`
**Access:** Citizens only

**RBAC Rule:**
- **403 Forbidden** if status is NOT 'Pending'
- Citizens can only delete their own reports
- CASCADE deletes associated evidence photos

**Response (Success):**
```json
{
  "message": "Report deleted successfully",
  "report_id": 123
}
```

**Response (Forbidden):**
```json
{
  "detail": "Cannot delete report with status 'Verified'. Only 'Pending' reports can be withdrawn."
}
```

---

## PART 4: Police API Routes (RBAC Enforced)

### 4.1 GET `/api/reports/police/all`
**Access:** Police only (enforced by `require_police` dependency)

**Query:** Automatically sorted with Pending reports at top:
1. Pending (priority 1)
2. Verified (priority 2)
3. Challan Issued (priority 3)
4. Rejected (priority 4)

**Response:**
```json
{
  "reports": [
    {
      "report_id": 1,
      "citizen_id": 1,
      "plate_no": "TN-01-AB-1234",
      "violation_type": "Speeding",
      "location_coords": "13.0827,80.2707",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "location_address": "Anna Salai, T. Nagar, Chennai",
      "description": "Car speeding at 80 km/h...",
      "status": "Pending",
      "fine_amount": 0.00,
      "date_reported": "2025-04-20T09:30:00",
      "reporter_name": "Aarav Sharma",
      "reporter_email": "aarav@example.com",
      "reporter_phone": "9876543210",
      "reporter_trust_score": 75,
      "reviewing_officer_name": null
    }
  ],
  "count": 8
}
```

**Security:**
- Requires valid JWT token with `role: "police"`
- Returns all reports (not filtered by officer)
- Includes citizen details for context

---

### 4.2 PUT `/api/reports/police/{report_id}/status`
**Access:** Police only

**Request Type:** `application/json`

**Request Body:**
```json
{
  "status": "Verified",
  "fine_amount": 0.00,
  "rejection_reason": null
}
```

**Or for Challan Issued:**
```json
{
  "status": "Challan Issued",
  "fine_amount": 5000.00,
  "rejection_reason": null
}
```

**Or for Rejected:**
```json
{
  "status": "Rejected",
  "fine_amount": 0.00,
  "rejection_reason": "Insufficient evidence, blurry image"
}
```

**RBAC Rules:**
- Automatically assigns logged-in officer's `badge_no` to `reviewed_by`
- Sets `reviewed_at` to current timestamp
- Only allows status change from "Pending" to prevent re-processing
- **NO DELETE ROUTE** - Police must use "Rejected" status for audit trail

**Valid Statuses:**
- `Verified` - Report confirmed, ready for challan generation
- `Rejected` - Report dismissed with reason
- `Challan Issued` - Fine issued with amount

**Response (Success):**
```json
{
  "message": "Report verified successfully",
  "report_id": 1,
  "status": "Verified",
  "reviewed_by": "TN-4521",
  "fine_amount": 0.00
}
```

**Response (Bad Request - Already Processed):**
```json
{
  "detail": "Report is already Verified. Cannot change status."
}
```

---

## RBAC Security Summary

| Route | Citizen Access | Police Access | Key Restriction |
|-------|---------------|---------------|-----------------|
| POST `/citizen/submit` | ✅ Own reports only | ❌ Forbidden | Auto-sets citizen_id from token |
| GET `/citizen/my` | ✅ Own reports only | ❌ Forbidden | Filters by citizen_id |
| GET `/citizen/{id}` | ✅ Own reports only | ❌ Forbidden | Checks ownership |
| PUT `/citizen/{id}` | ✅ Own Pending only | ❌ Forbidden | **403 if not Pending** |
| DELETE `/citizen/{id}` | ✅ Own Pending only | ❌ Forbidden | **403 if not Pending** |
| GET `/police/all` | ❌ Forbidden | ✅ All reports | Sorted by priority |
| PUT `/police/{id}/status` | ❌ Forbidden | ✅ All reports | Auto-assigns badge_no |

---

## Database Setup Instructions

### Step 1: Run Migration Script
```bash
mysql -u root -p traffic_violation_db < db/reports_enhancement.sql
```

### Step 2: Verify Table Structure
```sql
DESCRIBE REPORTS;
```

### Step 3: Verify Mock Data
```sql
SELECT report_id, plate_no, violation_type, location_address, 
       status, fine_amount, reviewed_by, date_reported
FROM REPORTS 
ORDER BY 
  CASE status 
    WHEN 'Pending' THEN 1 
    WHEN 'Verified' THEN 2 
    WHEN 'Challan Issued' THEN 3 
    WHEN 'Rejected' THEN 4 
  END;
```

---

## Testing the API

### Test Citizen Submit Report
```bash
curl -X POST https://margarakshak-backend.onrender.com/api/reports/citizen/submit \
  -H "Authorization: Bearer YOUR_CITIZEN_TOKEN" \
  -F "plate_no=TN-09-QR-4567" \
  -F "violation_type=Speeding" \
  -F "location_coords=13.0827,80.2707" \
  -F "location_address=Anna Salai, Chennai" \
  -F "latitude=13.0827" \
  -F "longitude=80.2707" \
  -F "description=Car speeding in school zone"
```

### Test Citizen Update (Should Fail if not Pending)
```bash
curl -X PUT https://margarakshak-backend.onrender.com/api/reports/citizen/1 \
  -H "Authorization: Bearer YOUR_CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plate_no": "TN-01-AB-9999"
  }'
```

### Test Police Get All Reports
```bash
curl -X GET https://margarakshak-backend.onrender.com/api/reports/police/all \
  -H "Authorization: Bearer YOUR_POLICE_TOKEN"
```

### Test Police Update Status
```bash
curl -X PUT https://margarakshak-backend.onrender.com/api/reports/police/1/status \
  -H "Authorization: Bearer YOUR_POLICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Challan Issued",
    "fine_amount": 2000.00
  }'
```

---

## Error Handling

### Common HTTP Status Codes:
- **200 OK** - Successful operation
- **400 Bad Request** - Invalid input data or status already processed
- **401 Unauthorized** - Missing or invalid JWT token
- **403 Forbidden** - Role mismatch or status restriction violated
- **404 Not Found** - Report doesn't exist or doesn't belong to user
- **500 Internal Server Error** - Database or server error

### Error Response Format:
```json
{
  "detail": "Human-readable error message"
}
```

---

## Key Security Features

1. **JWT Token Validation** - All routes require valid bearer token
2. **Role Verification** - `require_citizen` and `require_police` dependencies
3. **Ownership Checks** - Citizens can only access their own reports
4. **Status Guards** - UPDATE/DELETE blocked if status != 'Pending'
5. **Audit Trail** - Police actions logged with badge_no and timestamp
6. **No Police Delete** - Maintains complete audit history
7. **SQL Injection Prevention** - Parameterized queries throughout
8. **File Upload Validation** - Only JPEG/PNG allowed, size limits enforced

---

## Files Modified/Created

1. **`db/reports_enhancement.sql`** - Database migration + mock data
2. **`server/routes/reports.py`** - Complete RBAC API implementation
3. **`server/middleware/auth.py`** - Existing (no changes needed)
4. **`server/database.py`** - Existing (no changes needed)

---

## Next Steps

1. Run the SQL migration script on your database
2. Test all endpoints with Postman or curl
3. Update frontend to use new route paths:
   - Old: `/api/reports/` → New: `/api/reports/citizen/submit`
   - Old: `/api/reports/my` → New: `/api/reports/citizen/my`
4. Implement police review UI using `/api/reports/police/all` and `/api/reports/police/{id}/status`
