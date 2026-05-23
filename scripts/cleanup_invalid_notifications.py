"""
Clean up invalid notifications and verify notification system
"""
import pymysql

# Direct database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'port': 3306,
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'cursorclass': pymysql.cursors.DictCursor
}

def cleanup_invalid_notifications():
    """Remove notifications with 'Not Found' or empty messages."""
    
    print("=" * 70)
    print("🧹 CLEANING UP INVALID NOTIFICATIONS")
    print("=" * 70)
    
    conn = None
    cursor = None
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Find invalid notifications
        cursor.execute(
            """SELECT notif_id, citizen_id, notif_type, message, created_at
               FROM NOTIFICATIONS
               WHERE message IS NULL 
                  OR message = '' 
                  OR message = 'Not Found'
                  OR message LIKE '%404%'
                  OR message LIKE '%not found%'"""
        )
        invalid_notifs = cursor.fetchall()
        
        print(f"\n📊 Found {len(invalid_notifs)} invalid notifications:")
        for notif in invalid_notifs:
            print(f"   ID: {notif['notif_id']}, Type: {notif['notif_type']}, Message: {notif['message'][:50]}")
        
        if len(invalid_notifs) > 0:
            # Delete invalid notifications
            cursor.execute(
                """DELETE FROM NOTIFICATIONS
                   WHERE message IS NULL 
                      OR message = '' 
                      OR message = 'Not Found'
                      OR message LIKE '%404%'
                      OR message LIKE '%not found%'"""
            )
            conn.commit()
            print(f"\n✅ Deleted {cursor.rowcount} invalid notifications!")
        else:
            print("\n✅ No invalid notifications found. Database is clean!")
        
        # Show valid notification count
        cursor.execute("SELECT COUNT(*) as count FROM NOTIFICATIONS")
        total = cursor.fetchone()['count']
        print(f"\n📊 Total valid notifications: {total}")
        
        # Show notifications by type
        cursor.execute(
            """SELECT notif_type, COUNT(*) as count 
               FROM NOTIFICATIONS 
               GROUP BY notif_type"""
        )
        by_type = cursor.fetchall()
        print(f"\n📊 Notifications by type:")
        for row in by_type:
            print(f"   {row['notif_type']}: {row['count']}")
        
        # Test notification API data
        print("\n" + "=" * 70)
        print("🧪 TESTING CITIZEN NOTIFICATIONS (citizen_id: 1)")
        print("=" * 70)
        
        cursor.execute(
            """SELECT notif_id, message, is_read, notif_type, created_at
               FROM NOTIFICATIONS
               WHERE citizen_id = 1
               ORDER BY created_at DESC
               LIMIT 5"""
        )
        citizen_notifs = cursor.fetchall()
        
        if citizen_notifs:
            print(f"\n✅ Found {len(citizen_notifs)} notifications for citizen 1:")
            for notif in citizen_notifs:
                status = "✅ Read" if notif['is_read'] else "🔔 Unread"
                print(f"   {status} | {notif['notif_type']} | {notif['message'][:60]}")
        else:
            print("\n⚠️  No notifications for citizen 1")
        
        # Test police notifications
        print("\n" + "=" * 70)
        print("🧪 TESTING POLICE NOTIFICATIONS")
        print("=" * 70)
        
        cursor.execute(
            """SELECT notif_id, citizen_id, message, is_read, notif_type, created_at
               FROM NOTIFICATIONS
               ORDER BY created_at DESC
               LIMIT 5"""
        )
        police_notifs = cursor.fetchall()
        
        if police_notifs:
            print(f"\n✅ Found {len(police_notifs)} recent notifications:")
            for notif in police_notifs:
                status = "✅ Read" if notif['is_read'] else "🔔 Unread"
                print(f"   {status} | Citizen {notif['citizen_id']} | {notif['notif_type']} | {notif['message'][:60]}")
        else:
            print("\n⚠️  No notifications found")
        
        print("\n" + "=" * 70)
        print("✅ CLEANUP COMPLETE!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn and conn.open:
            conn.close()

if __name__ == "__main__":
    cleanup_invalid_notifications()
