import pymysql

print("Adding violation_type column to REPORTS table...")

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:
        # Add violation_type column
        cursor.execute("""
            ALTER TABLE REPORTS 
            ADD COLUMN violation_type VARCHAR(50) DEFAULT 'Other'
            AFTER plate_no
        """)
        print("✓ Added violation_type column")
        
        # Update existing records based on description keywords
        updates = [
            ("Speeding", "%speeding%"),
            ("Red Light Violation", "%red light%"),
            ("No Helmet", "%helmet%"),
            ("Wrong-Side Driving", "%wrong side%"),
            ("Using Phone", "%phone%"),
            ("Drunk Driving", "%drunk%"),
            ("Overloading", "%overload%")
        ]
        
        for violation_type, pattern in updates:
            cursor.execute("""
                UPDATE REPORTS 
                SET violation_type = %s 
                WHERE LOWER(description) LIKE %s
            """, (violation_type, pattern))
            print(f"✓ Updated {violation_type} violations")
        
        conn.commit()
        
        # Verify
        cursor.execute("SELECT violation_type, COUNT(*) as count FROM REPORTS GROUP BY violation_type")
        results = cursor.fetchall()
        print("\nViolation type distribution:")
        for r in results:
            print(f"  {r['violation_type']}: {r['count']}")
        
        print("\n✅ Database migration complete!")
        
except Exception as e:
    print(f"\n✗ Error: {e}")
    conn.rollback()
finally:
    conn.close()
