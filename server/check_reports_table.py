import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

with conn.cursor() as cursor:
    cursor.execute("DESCRIBE REPORTS")
    columns = cursor.fetchall()
    print("REPORTS table columns:")
    for col in columns:
        print(f"  {col['Field']}: {col['Type']}")

conn.close()
