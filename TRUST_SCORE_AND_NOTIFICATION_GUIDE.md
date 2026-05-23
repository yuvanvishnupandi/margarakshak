# 🔔 Trust Score & Notification System Implementation Guide

## Overview
This guide implements:
1. ✅ Real-time trust score updates (+10 for verified, -10 for rejected)
2. ✅ Rejection warnings and ban system
3. ✅ Notifications for citizens
4. ✅ Dashboard and profile trust score display

---

## 📋 Step 1: Run Database Migration

### Option A: Using MySQL Workbench (Recommended)
1. Open MySQL Workbench
2. Connect to localhost
3. Open file: `db/notification_system.sql`
4. Execute the entire script (⚡ lightning bolt icon)
5. Verify success messages

### Option B: Using Command Line
```bash
# Find your MySQL installation path (usually one of these):
# C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
# C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe

# Run the SQL file
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -pyvpandi@11 traffic_violation_db < db\notification_system.sql
```

### Verify Migration:
```sql
USE traffic_violation_db;

-- Check tables exist
SHOW TABLES LIKE 'NOTIFICATIONS';

-- Check columns added
DESCRIBE CITIZENS;
-- Should see: consecutive_rejections, total_rejections, ban_until, ban_reason

-- Check trigger exists
SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust';
```

---

## 🎯 Trust Score Rules (Automatic via Database Triggers)

### Trust Score Increases:
```
✅ Report Verified: +10 trust points, +5 reward points
✅ Resets consecutive rejection counter to 0
```

### Trust Score Decreases:
```
❌ Report Rejected: -10 trust points
❌ Increments consecutive_rejections counter
❌ Increments total_rejections counter
```

---

## 🚫 Ban System (Automatic)

The system automatically bans accounts based on consecutive rejections:

| Consecutive Rejections | Action | Ban Duration |
|------------------------|--------|--------------|
| 1 rejection | Info notification | None |
| 2 rejections | Warning notification | None |
| 3-4 rejections | Ban notification | 7 days |
| 5-6 rejections | Ban notification | 14 days |
| 7-9 rejections | Ban notification | 30 days |
| 10+ rejections | **PERMANENT BAN** | Forever |

### Example Notifications:

**1st Rejection:**
```
📋 Report Rejected
Your report #123 was rejected. Trust score decreased by 10 points. 
Please ensure future reports are accurate.
```

**2nd Consecutive Rejection:**
```
⚠️ Warning: 2 Consecutive Rejections
Your report #124 was rejected. This is your 2nd consecutive rejection. 
One more rejection will result in a 7-day ban. Please ensure reports are accurate.
```

**3rd Consecutive Rejection:**
```
🚫 Account Banned for 7 Days
Your report #125 was rejected. This is your 3rd consecutive rejection. 
Your account is banned for 7 days. If this continues, you will face longer bans.
```

**10th Consecutive Rejection:**
```
🔴 ACCOUNT PERMANENTLY BANNED
Your report #132 was rejected. This is your 10th consecutive rejection. 
Your account has been PERMANENTLY BANNED due to excessive false reports.
```

---

## 📊 Trust Score Display

### In Dashboard (Top Right Card):
```
┌─────────────────────────┐
│ Trust Score             │
│        75               │ (Green if >= 70)
│      / 100 points       │
│   [███████░░░]          │ (Progress bar)
└─────────────────────────┘
```

### In Profile Page (Hero Card):
```
┌─────────────────────────────────────────┐
│ [Shield Icon]  Current Trust Score      │
│                75                       │
│                Out of 100 points        │
│                                         │
│         Reward Points: 150              │
│         Status: Active                  │
└─────────────────────────────────────────┘
```

### Color Coding:
- 🟢 **Green** (70-200): Excellent reporter
- 🟡 **Yellow** (50-69): Good reporter
- 🟠 **Orange** (30-49): Needs improvement
- 🔴 **Red** (0-29): Poor reporter, risk of ban

---

## 🔧 Current Implementation Status

### ✅ Already Implemented:
1. **Trust score column** in CITIZENS table
2. **Basic trigger** for trust score updates
3. **Dashboard trust score card** (frontend)
4. **Profile trust score display** (frontend)
5. **Auto-fetch from database** on page load

### ⚠️ Needs Database Migration:
1. NOTIFICATIONS table
2. Enhanced trigger with ban logic
3. Rejection tracking columns

### 📝 Manual Steps Required:
Run the SQL migration (Step 1 above) to enable:
- Automatic notifications
- Ban system
- Rejection tracking

---

## 🧪 Testing the System

### Test Trust Score Increase:
1. Login as citizen
2. Submit a valid report with evidence
3. Login as police
4. Review and **Verify** the report
5. Return to citizen dashboard
6. ✅ Trust score should increase by 10
7. ✅ Reward points should increase by 5

### Test Trust Score Decrease:
1. Login as citizen
2. Submit a report (can be low quality)
3. Login as police
4. Review and **Reject** the report
5. Return to citizen dashboard
6. ✅ Trust score should decrease by 10
7. ✅ Warning notification should appear

### Test Ban System:
1. Submit 3 reports that will be rejected
2. Have police reject all 3 consecutively
3. ✅ Account should be banned for 7 days
4. ✅ Ban notification should appear
5. ✅ Login should be prevented during ban

---

## 📁 Files Created:

1. ✅ `db/notification_system.sql` - Complete database schema
2. ✅ `scripts/install_notification_system.py` - Installation script
3. ✅ `TRUST_SCORE_AND_NOTIFICATION_GUIDE.md` - This guide

---

## 🎯 How Trust Score Updates Work

### Flow Diagram:
```
Citizen submits report
        ↓
Police reviews report
        ↓
Police clicks "Verify" or "Reject"
        ↓
Backend updates REPORTS.status
        ↓
🔥 Database TRIGGER fires automatically
        ↓
Trigger calculates new trust score
        ↓
Updates CITIZENS.trust_score
        ↓
Creates NOTIFICATION (if rejected)
        ↓
Applies ban (if consecutive rejections)
        ↓
✅ Database updated instantly
        ↓
Citizen refreshes dashboard
        ↓
Frontend fetches new trust score
        ↓
UI displays updated score
```

---

## 🔍 Verify Trust Score is Working

### Check Database:
```sql
-- View citizen trust scores
SELECT citizen_id, full_name, email, trust_score, reward_points,
       consecutive_rejections, total_rejections, ban_until
FROM CITIZENS
WHERE email = 'your-email@example.com';

-- View notifications for a citizen
SELECT notification_type, title, message, is_read, created_at
FROM NOTIFICATIONS
WHERE citizen_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

### Check Frontend:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for trust score logs
4. Check Network tab for API calls
5. Verify `/api/auth/profile` returns correct trust_score

---

## 🚀 Quick Start

### To enable the complete system:

1. **Run SQL Migration** (Step 1 above)
2. **Restart Backend Server**:
   ```bash
   cd server
   python main.py
   ```
3. **Refresh Frontend**:
   ```bash
   # Frontend should already be running
   # Just refresh browser (Ctrl+R)
   ```
4. **Test**:
   - Submit report → Verify → Check trust score increases
   - Submit report → Reject → Check trust score decreases
   - Check notifications appear

---

## 💡 Important Notes

### Trust Score Range:
- **Minimum**: 0 (cannot go negative)
- **Maximum**: 200 (can exceed 100)
- **Starting**: 50 (default for new users)

### Ban Behavior:
- Banned users cannot login (backend should check `ban_until`)
- Ban is lifted automatically after `ban_until` date
- Permanent ban = 999999 days (effectively forever)

### Notification Behavior:
- Notifications persist in database
- Can be marked as read
- Show in chronological order (newest first)
- Include title, message, type, and timestamp

---

## ✅ Completion Checklist

After running migration:

- [ ] NOTIFICATIONS table exists
- [ ] CITIZENS table has new columns
- [ ] Enhanced trigger is installed
- [ ] Trust score updates on verify/reject
- [ ] Notifications created on rejection
- [ ] Ban applied after consecutive rejections
- [ ] Dashboard shows trust score
- [ ] Profile shows trust score
- [ ] Color coding works correctly
- [ ] Progress bar displays accurately

---

## 📞 Support

If trust score is not updating:

1. **Check trigger exists**:
   ```sql
   SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust';
   ```

2. **Check trigger code**:
   ```sql
   SHOW CREATE TRIGGER trg_report_status_trust;
   ```

3. **Manually test trigger**:
   ```sql
   -- Update a report status
   UPDATE REPORTS SET status = 'Verified' WHERE report_id = 123;
   
   -- Check if trust score changed
   SELECT trust_score FROM CITIZENS WHERE citizen_id = 1;
   ```

4. **Check backend logs** for errors

5. **Restart MySQL server** if needed

---

**Last Updated:** April 26, 2026  
**Status:** 🔄 Awaiting Database Migration  
**Priority:** HIGH - Required for trust score system
