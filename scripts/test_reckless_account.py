"""
Test suspension for reckless@test.com account
"""
import pymysql

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

def test_suspension():
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check user's current status
        cursor.execute(
            "SELECT citizen_id, email, trust_score, account_status FROM CITIZENS WHERE email = 'reckless@test.com'"
        )
        user = cursor.fetchone()
        
        if not user:
            print("❌ User 'reckless@test.com' not found!")
            return
        
        print("=" * 70)
        print(f"👤 User Found:")
        print(f"   Citizen ID: {user['citizen_id']}")
        print(f"   Email: {user['email']}")
        print(f"   Trust Score: {user['trust_score']}")
        print(f"   Account Status: {user['account_status']}")
        print("=" * 70)
        
        # If trust_score is 0 but status is not Suspended, fix it
        if user['trust_score'] <= 0 and user['account_status'] != 'Suspended':
            print("\n⚠️  Trust score is 0 but account not suspended. Fixing...")
            cursor.execute(
                "UPDATE CITIZENS SET account_status = 'Suspended' WHERE citizen_id = %s",
                (user['citizen_id'],)
            )
            conn.commit()
            print("✅ Account status updated to 'Suspended'")
            
            # Refresh user data
            cursor.execute(
                "SELECT citizen_id, email, trust_score, account_status FROM CITIZENS WHERE email = 'reckless@test.com'"
            )
            user = cursor.fetchone()
        
        # Insert suspension notification manually (in case trigger didn't fire)
        print("\n📝 Inserting suspension notification...")
        cursor.execute(
            """INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read, created_at)
               VALUES (%s, 'Account Suspended', 
                       'Your account has been suspended due to low trust score (0). Reporting features are now disabled. Please contact the traffic department to appeal.',
                       FALSE, NOW())""",
            (user['citizen_id'],)
        )
        conn.commit()
        print("✅ Notification inserted!")
        
        print("\n" + "=" * 70)
        print("✅ TEST SETUP COMPLETE!")
        print("=" * 70)
        print(f"\n🧪 Testing Instructions:")
        print(f"   1. Login with email: reckless@test.com")
        print(f"   2. Check your password (you'll need to use the correct one)")
        print(f"   3. Navigate to 'Submit Report' page")
        print(f"   4. You should see:")
        print(f"      ✅ RED ALERT BANNER with 'ACCESS DENIED'")
        print(f"      ✅ Form should be HIDDEN")
        print(f"      ✅ Notification bell should show 1 unread notification")
        print("=" * 70)
        
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.open:
            conn.close()

if __name__ == "__main__":
    test_suspension()
