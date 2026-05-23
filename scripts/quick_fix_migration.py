"""
Quick Migration Script - Adds citizen_id to VEHICLES table
Run this: python quick_fix_migration.py
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

try:
    print("Connecting to database...")
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("Checking if citizen_id column exists...")
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'traffic_violation_db'
        AND TABLE_NAME = 'VEHICLES'
        AND COLUMN_NAME = 'citizen_id'
    """)
    
    exists = cursor.fetchone()['count']
    
    if exists > 0:
        print("✅ citizen_id column already exists!")
    else:
        print("Adding citizen_id column to VEHICLES table...")
        cursor.execute("""
            ALTER TABLE VEHICLES 
            ADD COLUMN citizen_id INT NULL AFTER owner_name,
            ADD CONSTRAINT fk_vehicle_citizen 
            FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE SET NULL
        """)
        conn.commit()
        print("✅ Migration successful!")
    
    # Verify
    cursor.execute("DESCRIBE VEHICLES")
    columns = cursor.fetchall()
    print("\nVEHICLES table structure:")
    for col in columns:
        print(f"  {col[0]} - {col[1]}")
    
    cursor.close()
    conn.close()
    
    print("\n✅ DONE! You can now register citizens with vehicles.")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nMake sure:")
    print("1. MySQL is running")
    print("2. Database 'traffic_violation_db' exists")
    print("3. Credentials are correct")
    input("\nPress Enter to exit...")
