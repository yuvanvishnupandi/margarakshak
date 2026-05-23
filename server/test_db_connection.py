import mysql.connector

try:
    print("Testing database connection...")
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='yvpandi@11',
        database='traffic_violation_db',
        connection_timeout=5
    )
    print("✓ Database connection successful")
    
    cursor = conn.cursor()
    cursor.execute('SHOW TABLES')
    tables = cursor.fetchall()
    print(f"\nTables found: {len(tables)}")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check if CITIZENS table exists and its structure
    cursor.execute("DESCRIBE CITIZENS")
    columns = cursor.fetchall()
    print("\nCITIZENS table structure:")
    for col in columns:
        print(f"  {col[0]}: {col[1]}")
    
    cursor.close()
    conn.close()
    print("\n✓ Database test completed successfully")
    
except Exception as e:
    print(f"\n✗ Database error: {str(e)}")
