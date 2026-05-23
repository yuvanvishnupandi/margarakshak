import mysql.connector
import sys

print("Step 1: Connecting to MySQL (without database)...")
try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='yvpandi@11',
        connection_timeout=5
    )
    print("✓ Connected to MySQL server")
    
    cursor = conn.cursor()
    cursor.execute('SHOW DATABASES')
    dbs = cursor.fetchall()
    print("\nDatabases available:")
    for db in dbs:
        print(f"  - {db[0]}")
    
    cursor.close()
    conn.close()
    print("\n✓ Test completed")
    
except Exception as e:
    print(f"\n✗ Error: {str(e)}")
    sys.exit(1)
