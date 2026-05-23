import pymysql

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

tables_to_check = ['CHALLANS', 'VIOLATION_EVENTS', 'VIOLATION_RULES', 'VEHICLES']

with conn.cursor() as cursor:
    for table in tables_to_check:
        try:
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            print(f"\n{table} columns:")
            for col in columns:
                print(f"  {col['Field']}: {col['Type']}")
        except Exception as e:
            print(f"\n{table}: {e}")

conn.close()
