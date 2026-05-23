"""
Install notification system and ban tracking
Run this to add rejection warnings and trust score updates
"""
import pymysql

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306
}

print("=" * 80)
print("Installing Notification System & Ban Tracking")
print("=" * 80)

try:
    # Read SQL file
    with open('db/notification_system.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    # Connect to database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n⏳ Executing SQL script...")
    
    # Execute each statement
    statements = sql_script.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--'):
            try:
                cursor.execute(statement)
            except Exception as e:
                # Ignore DELIMITER and USE statements errors
                if 'DELIMITER' not in statement and 'USE' not in statement:
                    print(f"  Warning: {e}")
    
    conn.commit()
    print("\n✅ SQL script executed successfully!")
    
    # Verify tables exist
    print("\n" + "=" * 80)
    print("Verification:")
    print("=" * 80)
    
    cursor.execute("SHOW TABLES LIKE 'NOTIFICATIONS'")
    if cursor.fetchone():
        print("✅ NOTIFICATIONS table created")
    else:
        print("❌ NOTIFICATIONS table not found")
    
    cursor.execute("DESCRIBE CITIZENS")
    columns = [row[0] for row in cursor.fetchall()]
    
    if 'consecutive_rejections' in columns:
        print("✅ consecutive_rejections column added to CITIZENS")
    else:
        print("❌ consecutive_rejections column not found")
    
    if 'total_rejections' in columns:
        print("✅ total_rejections column added to CITIZENS")
    else:
        print("❌ total_rejections column not found")
    
    if 'ban_until' in columns:
        print("✅ ban_until column added to CITIZENS")
    else:
        print("❌ ban_until column not found")
    
    # Check trigger
    cursor.execute("SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust'")
    if cursor.fetchone():
        print("✅ Enhanced trigger trg_report_status_trust installed")
    else:
        print("❌ Trigger not found")
    
    print("\n" + "=" * 80)
    print("✅ Installation Complete!")
    print("=" * 80)
    print("\nTrust Score Rules:")
    print("  ✅ Report Verified: +10 trust, +5 rewards")
    print("  ❌ Report Rejected: -10 trust")
    print("\nBan System:")
    print("  1 rejection: Info notification")
    print("  2 consecutive: Warning notification")
    print("  3-4 consecutive: 7-day ban")
    print("  5-6 consecutive: 14-day ban")
    print("  7-9 consecutive: 30-day ban")
    print("  10+ consecutive: PERMANENT BAN")
    print("\nNotifications will appear in citizen dashboard and profile!")
    
    cursor.close()
    conn.close()
    
except FileNotFoundError:
    print("\n❌ Error: db/notification_system.sql not found")
    print("Make sure you're running this from the project root directory")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
