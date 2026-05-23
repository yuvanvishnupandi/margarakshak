import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='yvpandi@11',
        database='traffic_violation_db'
    )
    
    cursor = conn.cursor()
    
    print("=== CITIZENS Table Schema ===")
    cursor.execute("DESCRIBE CITIZENS")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[0]:20} {col[1]:30} {col[2]:10} {col[4]}")
    
    print("\n=== Testing Registration Insert ===")
    # Test if the INSERT statement will work
    cursor.execute("""
        INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, ("Test User", "test@example.com", "1234567890", "test_hash", 50, 0, "Active"))
    
    conn.commit()
    print(f"✅ Test insert successful! ID: {cursor.lastrowid}")
    
    # Clean up test data
    cursor.execute("DELETE FROM CITIZENS WHERE email = 'test@example.com'")
    conn.commit()
    print("✅ Test data cleaned up")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
