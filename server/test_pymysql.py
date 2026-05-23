"""
Test MySQL connection using PyMySQL (alternative library)
"""
import sys

print("Testing with PyMySQL...")
try:
    import pymysql
    print("✓ PyMySQL is installed")
    
    print("\nAttempting connection...")
    connection = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='yvpandi@11',
        port=3306,
        connect_timeout=3,
        read_timeout=5,
        write_timeout=5,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    print("✓ SUCCESS! Connected with PyMySQL")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION() as version")
        result = cursor.fetchone()
        print(f"MySQL Version: {result['version']}")
        
        cursor.execute("SHOW DATABASES")
        databases = cursor.fetchall()
        print(f"\nDatabases ({len(databases)}):")
        for db in databases:
            print(f"  - {db['Database']}")
    
    connection.close()
    print("\n✓ Connection closed properly")
    
except ImportError:
    print("✗ PyMySQL not installed. Install with: pip install pymysql")
except Exception as e:
    print(f"✗ Connection failed: {type(e).__name__}: {e}")
