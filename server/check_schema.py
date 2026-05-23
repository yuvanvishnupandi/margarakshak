import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cursor:
    # Check REPORTS table
    cursor.execute("DESCRIBE REPORTS")
    print("REPORTS columns:")
    cols = cursor.fetchall()
    for c in cols:
        print(f"  {c['Field']}: {c['Type']}")
    
    # Check if violation_type exists
    has_violation_type = any(c['Field'] == 'violation_type' for c in cols)
    print(f"\nHas violation_type column: {has_violation_type}")
    
    # Check sample data
    cursor.execute("SELECT * FROM REPORTS LIMIT 3")
    rows = cursor.fetchall()
    print(f"\nSample reports ({len(rows)}):")
    for row in rows:
        print(f"  {row}")

conn.close()
