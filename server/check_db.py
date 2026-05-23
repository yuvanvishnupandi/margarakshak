import mysql.connector

try:
    # Use your password here
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="yvpandi@11" 
    )
    cursor = db.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS traffic_violation_db")
    print("✅ Database is ready!")
except Exception as e:
    print(f"❌ Connection failed: {e}")