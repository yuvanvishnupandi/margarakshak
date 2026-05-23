"""
Add new notification types to NOTIFICATIONS table
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

def update_notification_types():
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Alter the ENUM to include new notification types
        cursor.execute(
            """ALTER TABLE NOTIFICATIONS 
               MODIFY COLUMN notif_type ENUM(
                   'Report Verified',
                   'Report Rejected',
                   'Challan Issued',
                   'Appeal Status',
                   'Account Suspended',
                   'Trust Score Warning',
                   'New Appeal',
                   'General'
               ) NOT NULL DEFAULT 'General'"""
        )
        
        conn.commit()
        
        print("=" * 70)
        print("✅ NOTIFICATION TYPES UPDATED SUCCESSFULLY!")
        print("=" * 70)
        print("\n📋 Available notification types:")
        print("   1. Report Verified")
        print("   2. Report Rejected")
        print("   3. Challan Issued")
        print("   4. Appeal Status")
        print("   5. Account Suspended ✅ NEW")
        print("   6. Trust Score Warning ✅ NEW")
        print("   7. New Appeal ✅ NEW")
        print("   8. General")
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
    update_notification_types()
