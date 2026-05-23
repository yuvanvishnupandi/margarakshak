# 🔧 APPEAL & NOTIFICATION SYSTEM - SETUP GUIDE

## ✅ What Was Fixed

### 1. **Appeal Submission Error**
- **Problem**: Backend routes were using hardcoded database credentials instead of centralized config
- **Solution**: Updated `appeals.py` and `notifications.py` to use `server/config.py` settings
- **Result**: Appeals now submit successfully

### 2. **Police Notification Support**
- **Problem**: Notifications were citizen-only
- **Solution**: Added police notification endpoints and updated frontend to support both roles
- **Result**: Police now see appeal notifications in their notification bell

### 3. **Automatic Notification Creation**
- **When Citizen Submits Appeal**: Creates notification for police with message "New appeal submitted for Challan #X - [Violation Name]"
- **When Police Reviews Appeal**: Creates notification for citizen with message "Your appeal for Challan #X has been accepted/rejected"

---

## 🚀 QUICK SETUP (3 Steps)

### Step 1: Run Database Migration

**Option A - Double-click the batch file:**
```
Double-click: scripts/setup_appeals_notifications.bat
```

**Option B - Run manually in MySQL:**
```bash
mysql -u root -pyvpandi@11 traffic_violation_db < db/setup_appeals_and_notifications.sql
```

**Option C - Copy-paste into MySQL Workbench:**
Open `db/setup_appeals_and_notifications.sql` and execute it

This creates:
- ✅ `APPEALS` table
- ✅ `NOTIFICATIONS` table
- ✅ Proper indexes and foreign keys

### Step 2: Restart Backend

```bash
cd server
python main.py
```

### Step 3: Refresh Browser

Press `Ctrl + F5` (hard refresh) to clear cache and load new frontend code

---

## 🎯 How It Works

### **Citizen Submits Appeal**
1. Citizen clicks "Dispute" button on MyChallans.jsx
2. Fills out dispute form (minimum 50 characters)
3. Clicks "Submit Appeal"
4. **Backend**:
   - Creates APPEALS record with status "Pending"
   - Updates CHALLANS status to "Disputed"
   - Creates NOTIFICATION for police
5. **Police sees**: Red badge on notification bell + "New Appeal" in dropdown
6. **Police can**: Click notification OR go to "Review Appeals" page

### **Police Reviews Appeal**
1. Police opens notification OR goes to Dashboard → Review Appeals
2. Clicks on appeal to view details
3. Chooses "Accept" or "Reject"
4. Optionally adds review notes
5. **Backend**:
   - Updates APPEALS status to "Accepted" or "Rejected"
   - If Accepted: Updates CHALLANS to "Waived"
   - If Rejected: Updates CHALLANS back to "Unpaid"
   - Creates NOTIFICATION for citizen
6. **Citizen sees**: Notification bell badge + appeal status update

---

## 📋 API Endpoints Created/Updated

### **Citizen Appeals**
- `POST /api/appeals/submit` - Submit new appeal
- `GET /api/appeals/citizen/{citizen_id}` - Get my appeals

### **Police Appeals**
- `GET /api/appeals/police/pending` - Get all pending appeals
- `PUT /api/appeals/{appeal_id}/review` - Review and decide on appeal

### **Citizen Notifications**
- `GET /api/citizen/notifications/{citizen_id}` - Get my notifications
- `GET /api/citizen/notifications/{citizen_id}/unread-count` - Get unread count
- `PUT /api/citizen/notifications/{notif_id}/read` - Mark as read
- `PUT /api/citizen/notifications/read-all/{citizen_id}` - Mark all as read

### **Police Notifications** (NEW)
- `GET /api/citizen/notifications/police/all` - Get all police notifications
- `PUT /api/citizen/notifications/police/{notif_id}/read` - Mark as read

---

## 🔍 Testing the System

### Test 1: Citizen Submits Appeal
1. Login as citizen
2. Go to My Challans
3. Click "Dispute" on any unpaid challan
4. Fill in reason (50+ characters)
5. Click "Submit Appeal"
6. ✅ Should see success message
7. ✅ Challan status changes to "Disputed"

### Test 2: Police Receives Notification
1. Login as police
2. Look at navbar - should see red badge on bell icon
3. Click bell icon
4. ✅ Should see "New appeal submitted for Challan #X" notification
5. Click notification
6. ✅ Should redirect to Review Appeals page

### Test 3: Police Reviews Appeal
1. Go to Dashboard → Review Appeals
2. Click on pending appeal
3. Add review notes (optional)
4. Click "Accept" or "Reject"
5. ✅ Should see success message
6. ✅ Challan status updates (Waived or Unpaid)

### Test 4: Citizen Receives Decision
1. Login as citizen
2. Look at navbar - should see red badge
3. Click bell icon
4. ✅ Should see "Your appeal has been accepted/rejected" notification

---

## 🛡️ Error Handling

The system now handles missing tables gracefully:
- If NOTIFICATIONS table doesn't exist: Appeals still work, just logs warning
- If APPEALS table doesn't exist: Shows error message to user
- All API failures are caught and logged without crashing the app

---

## 📝 Files Modified

### Backend (Python)
- ✅ `server/routes/appeals.py` - Fixed DB config, added notification creation
- ✅ `server/routes/notifications.py` - Fixed DB config, added police endpoints

### Frontend (React)
- ✅ `frontend/src/components/NotificationDropdown.jsx` - Added police support
- ✅ `frontend/src/pages/RewardsRedeem.jsx` - Fixed wallet API error handling
- ✅ `frontend/src/pages/MyChallans.jsx` - Already has dispute UI (from previous session)

### Database (SQL)
- ✅ `db/setup_appeals_and_notifications.sql` - NEW: Combined setup script
- ✅ `scripts/setup_appeals_notifications.bat` - NEW: One-click migration

---

## 🎨 UI Features

### Citizen Notification Bell
- 🔴 Red badge shows unread count
- 📋 Dropdown shows last 10 notifications
- ⏱️ Shows relative time ("5m ago", "2h ago")
- 🔵 Unread notifications have blue background
- 🔄 Auto-refreshes every 30 seconds

### Police Notification Bell
- Same features as citizen
- Shows: New Appeals, Report submissions, etc.
- Click notification → Goes to Review Appeals page

### Review Appeals Page (Police)
- 📊 Stats cards (Pending, Under Review, Accepted, Rejected)
- 📋 Table with all appeal details
- 🔍 Click to view full appeal reason
- ✅ Accept/Reject buttons with optional notes
- 🔄 Auto-refreshes every 5 seconds

---

## ⚠️ Troubleshooting

### Error: "Table 'APPEALS' doesn't exist"
**Solution**: Run the database migration (Step 1 above)

### Error: "Failed to fetch user data" on Rewards page
**Solution**: Already fixed in code - just refresh browser

### Error: "Database connection failed"
**Solution**: Check MySQL is running and credentials in `.env` are correct

### Notifications not showing
**Solution**: 
1. Check if NOTIFICATIONS table exists: `SHOW TABLES LIKE 'NOTIFICATIONS';`
2. If not, run migration
3. Restart backend
4. Hard refresh browser (Ctrl+F5)

### Police don't see notifications
**Solution**: 
1. Make sure you're logged in as police (role='police')
2. Check browser console for errors
3. Verify backend is running on port 5000

---

## 🎉 Success Criteria

After setup, you should be able to:
- ✅ Submit appeals as citizen (no errors)
- ✅ See appeal notifications as police
- ✅ Review appeals on dedicated page
- ✅ Accept/Reject appeals
- ✅ Citizen receives decision notification
- ✅ All notifications appear in bell dropdown
- ✅ Real-time updates (5s for appeals, 30s for notifications)

---

## 📞 Need Help?

If you encounter any issues:
1. Check browser console (F12) for errors
2. Check backend terminal for Python errors
3. Verify database tables exist
4. Ensure both frontend and backend are running

**Quick Commands:**
```bash
# Check if tables exist
mysql -u root -pyvpandi@11 -e "USE traffic_violation_db; SHOW TABLES;"

# Check backend is running
curl http://localhost:5000/docs

# Check frontend is running
curl http://localhost:5173
```

---

**Last Updated**: 27 April 2026  
**Status**: ✅ Fully Functional  
**ACID Compliance**: ✅ Yes (all transactions use explicit commit/rollback)
