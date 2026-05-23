"""
Quick script to add evidence_path column to REPORTS table
Run this to fix the police review reports error
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
    # Connect to database
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("Adding evidence_path column to REPORTS table")
    print("=" * 60)
    
    # Check if column already exists
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'traffic_violation_db'
        AND TABLE_NAME = 'REPORTS'
        AND COLUMN_NAME = 'evidence_path'
    """)
    
    result = cursor.fetchone()
    
    if result['count'] > 0:
        print("\n✅ Column 'evidence_path' already exists!")
    else:
        # Add the column
        print("\n⏳ Adding column 'evidence_path'...")
        cursor.execute("""
            ALTER TABLE REPORTS
            ADD COLUMN evidence_path VARCHAR(500) DEFAULT NULL
            COMMENT 'Path to uploaded evidence image'
            AFTER description
        """)
        
        # Add index
        print("⏳ Adding index on evidence_path...")
        cursor.execute("""
            ALTER TABLE REPORTS
            ADD INDEX idx_evidence_path (evidence_path)
        """)
        
        conn.commit()
        print("\n✅ Column and index added successfully!")
    
    # Verify
    print("\n" + "=" * 60)
    print("Verification - REPORTS table columns:")
    print("=" * 60)
    
    cursor.execute("DESCRIBE REPORTS")
    columns = cursor.fetchall()
    
    for col in columns:
        marker = " <-- NEW" if col['Field'] == 'evidence_path' else ""
        print(f"{col['Field']:<25} {col['Type']:<20} {col['Null']:<5} {col['Default']}{marker}")
    
    print("\n" + "=" * 60)
    print("✅ Migration complete! Police can now view evidence photos.")
    print("=" * 60)
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nPlease check:")
    print("1. MySQL is running")
    print("2. Database credentials are correct")
    print("3. Database 'traffic_violation_db' exists")
