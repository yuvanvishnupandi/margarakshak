# 🔧 Evidence Path Column Migration Guide

## Problem
Police portal shows error when clicking "Review Reports":
```
(1054, "Unknown column 'r.evidence_path' in 'field list'")
```

## Root Cause
The `evidence_path` column was not added to the `REPORTS` table in the database. The backend code expects this column to store uploaded evidence photo paths.

---

## ✅ Quick Fix (Automated)

### Windows:
```bash
cd scripts
add_evidence_path.bat
```

### Manual:
```bash
cd db
mysql -u root -pyvpandi@11 traffic_violation_db < add_evidence_path_column.sql
```

---

## 📋 What This Migration Does

1. **Adds `evidence_path` column** to REPORTS table
   - Type: VARCHAR(500)
   - Nullable: YES (allows reports without images)
   - Position: After `description` column

2. **Adds index** for performance optimization
   - Index name: `idx_evidence_path`
   - Speeds up queries filtering by evidence

3. **Tier-1 DBMS Compliance**
   - Proper column documentation
   - Indexed for query optimization
   - Maintains relational integrity

---

## 🔍 Verify Migration

After running the migration, verify the column exists:

```sql
USE traffic_violation_db;

-- Check column exists
DESCRIBE REPORTS;

-- Or query information schema
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'traffic_violation_db' 
  AND TABLE_NAME = 'REPORTS' 
  AND COLUMN_NAME = 'evidence_path';
```

Expected output:
```
+---------------+--------------+------+-----+---------+-------+
| COLUMN_NAME   | DATA_TYPE    | NULL | KEY | DEFAULT | Extra |
+---------------+--------------+------+-----+---------+-------+
| evidence_path | varchar(500) | YES  |     | NULL    |       |
+---------------+--------------+------+-----+---------+-------+
```

---

## 🎯 How Evidence Photos Work

### Citizen Submits Report:
1. Citizen fills report form
2. Uploads evidence photo (JPEG/PNG, max 5MB)
3. Frontend creates report → gets `report_id`
4. Frontend uploads image to `/api/reports/upload-evidence/{report_id}`
5. Backend saves image to `server/uploads/evidence/report_{id}_{timestamp}.jpg`
6. Backend updates `REPORTS.evidence_path` with `/uploads/evidence/filename.jpg`

### Police Views Reports:
1. Police clicks "Review Reports"
2. Backend queries: `SELECT ... r.evidence_path ... FROM REPORTS`
3. Frontend displays thumbnail: `<img src="https://margarakshak-backend.onrender.com{evidence_path}" />`
4. Police clicks thumbnail → Opens full-size image in new tab

---

## 📁 File Storage Structure

```
server/
└── uploads/
    └── evidence/
        ├── report_123_20260426_143022.jpg
        ├── report_124_20260426_145533.png
        └── report_125_20260426_151244.jpg
```

### Database Storage:
```sql
SELECT report_id, plate_no, evidence_path FROM REPORTS WHERE evidence_path IS NOT NULL;

+------------+------------+-------------------------------------------+
| report_id  | plate_no   | evidence_path                             |
+------------+------------+-------------------------------------------+
| 123        | TN01AB1234 | /uploads/evidence/report_123_202604.jpg  |
| 124        | TN02CD5678 | /uploads/evidence/report_124_202604.png  |
+------------+------------+-------------------------------------------+
```

---

## 🔒 Tier-1 DBMS Compliance

### Data Integrity:
- ✅ Column properly typed (VARCHAR 500)
- ✅ Nullable (allows reports without evidence)
- ✅ Indexed for performance
- ✅ Documented with COMMENT

### Security:
- ✅ File type validation (JPEG/PNG only)
- ✅ File size limit (5MB max)
- ✅ Unique filenames (timestamp-based)
- ✅ Static file serving via FastAPI

### Performance:
- ✅ Index on evidence_path column
- ✅ Efficient JOIN queries
- ✅ Optimized image loading

---

## 🧪 Testing Checklist

After migration, test the complete flow:

### 1. Database Verification:
```sql
-- Column exists
SHOW COLUMNS FROM REPORTS LIKE 'evidence_path';

-- Test update
UPDATE REPORTS SET evidence_path = '/uploads/evidence/test.jpg' WHERE report_id = 1;
SELECT evidence_path FROM REPORTS WHERE report_id = 1;
```

### 2. Backend API Test:
```bash
# Check pending reports endpoint
curl https://margarakshak-backend.onrender.com/api/reports/police/pending
```

Expected: No column error, returns reports with evidence_path field

### 3. Frontend Test:
1. Login as citizen
2. Submit report with photo
3. Login as police
4. Click "Review Reports"
5. Verify:
   - ✅ No error message
   - ✅ Evidence column shows thumbnail
   - ✅ Click thumbnail opens full image

---

## 🚨 Troubleshooting

### Error: Column still not found
**Solution:**
```sql
-- Manually add column
USE traffic_violation_db;
ALTER TABLE REPORTS ADD COLUMN evidence_path VARCHAR(500) DEFAULT NULL AFTER description;
```

### Error: MySQL connection failed
**Solution:**
- Check MySQL is running: `net start MySQL`
- Verify credentials in migration script
- Update password if different

### Images not displaying
**Check:**
1. `server/uploads/evidence/` directory exists
2. FastAPI serving static files: `app.mount("/uploads", StaticFiles(...))`
3. File permissions allow reading
4. Browser console for 404 errors

---

## 📊 Database Schema (After Migration)

```sql
CREATE TABLE REPORTS (
    report_id       INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    plate_no        VARCHAR(20)     DEFAULT NULL,
    location_coords VARCHAR(60)     DEFAULT NULL,
    location_address VARCHAR(300)   DEFAULT NULL,
    description     TEXT            NOT NULL,
    evidence_path   VARCHAR(500)    DEFAULT NULL,  -- ← NEW COLUMN
    date_reported   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
    reviewed_by     VARCHAR(20)     DEFAULT NULL,
    reviewed_at     DATETIME        DEFAULT NULL,
    rejection_reason TEXT           DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign keys and indexes...
    INDEX idx_evidence_path (evidence_path)  -- ← NEW INDEX
) ENGINE=InnoDB;
```

---

## ✅ Completion Checklist

- [ ] Run migration script (`add_evidence_path.bat`)
- [ ] Verify column exists in database
- [ ] Restart backend server
- [ ] Test citizen report submission with image
- [ ] Test police review reports page
- [ ] Verify evidence thumbnails display
- [ ] Test clicking thumbnail opens full image
- [ ] Confirm no console errors

---

## 📝 Notes

- **Backward Compatible:** Existing reports without images will have `NULL` evidence_path
- **No Data Loss:** Migration only adds column, doesn't modify existing data
- **Reversible:** Can drop column if needed: `ALTER TABLE REPORTS DROP COLUMN evidence_path;`
- **Production Ready:** Follows Tier-1 DBMS standards

---

**Last Updated:** April 26, 2026  
**Migration Version:** 1.0  
**Status:** ✅ Required for Evidence Photo Feature
