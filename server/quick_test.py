import mysql.connector
import socket

print("Testing MySQL connection...")
print(f"Host: 127.0.0.1")
print(f"Port: 3306")

# First test if port is reachable
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex(('127.0.0.1', 3306))
    sock.close()
    if result == 0:
        print("✓ Port 3306 is open and reachable")
    else:
        print("✗ Port 3306 is NOT reachable")
        exit(1)
except Exception as e:
    print(f"✗ Socket test failed: {e}")
    exit(1)

# Now try to connect
print("\nAttempting MySQL connection...")
try:
    conn = mysql.connector.connect(
        host='127.0.0.1',
        user='root',
        password='yvpandi@11',
        port=3306,
        connection_timeout=3,
        auth_plugin='mysql_native_password'  # Force native auth
    )
    print("✓ SUCCESS! Connected to MySQL")
    conn.close()
except mysql.connector.Error as err:
    print(f"✗ MySQL Error: {err}")
    print(f"   Error Code: {err.errno}")
except Exception as e:
    print(f"✗ Unexpected error: {type(e).__name__}: {e}")
