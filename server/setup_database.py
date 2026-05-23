"""
Database Setup Script - Creates database and tables
Run this ONCE to initialize your database
"""
import mysql.connector
import sys

def setup_database():
    print("=" * 60)
    print("TRAFFIC VIOLATION DATABASE SETUP")
    print("=" * 60)
    
    # Step 1: Connect to MySQL (without database)
    print("\n[1/4] Connecting to MySQL server...")
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='yvpandi@11',
            port=3306,
            connection_timeout=5
        )
        print("✓ Connected to MySQL successfully")
    except Exception as e:
        print(f"✗ FAILED to connect to MySQL: {str(e)}")
        print("\nTROUBLESHOOTING:")
        print("1. Make sure MySQL service is running")
        print("2. Check if password 'yvpandi@11' is correct")
        print("3. Check if MySQL is running on port 3306")
        sys.exit(1)
    
    cursor = conn.cursor()
    
    # Step 2: Create database
    print("\n[2/4] Creating database 'traffic_violation_db'...")
    try:
        cursor.execute("CREATE DATABASE IF NOT EXISTS traffic_violation_db")
        print("✓ Database created/verified")
    except Exception as e:
        print(f"✗ FAILED to create database: {str(e)}")
        cursor.close()
        conn.close()
        sys.exit(1)
    
    # Step 3: Use the database
    cursor.execute("USE traffic_violation_db")
    print("✓ Using database 'traffic_violation_db'")
    
    # Step 4: Create tables
    print("\n[3/4] Creating tables...")
    
    tables_sql = [
        """
        CREATE TABLE IF NOT EXISTS CITIZENS (
            citizen_id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone_no VARCHAR(20),
            password_hash VARCHAR(255) NOT NULL,
            trust_score INT DEFAULT 50,
            reward_points INT DEFAULT 0,
            account_status VARCHAR(20) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS POLICE_OFFICERS (
            badge_no VARCHAR(20) PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone_no VARCHAR(20),
            password_hash VARCHAR(255) NOT NULL,
            officer_rank VARCHAR(50) DEFAULT 'Constable',
            station_code VARCHAR(20) DEFAULT 'HQ001',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    ]
    
    for sql in tables_sql:
        try:
            cursor.execute(sql)
            print("✓ Table created successfully")
        except Exception as e:
            print(f"✗ FAILED to create table: {str(e)}")
    
    conn.commit()
    
    # Step 5: Verify tables
    print("\n[4/4] Verifying tables...")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"✓ Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Cleanup
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("DATABASE SETUP COMPLETE!")
    print("=" * 60)
    print("\nYou can now start your backend server and use the app.")

if __name__ == "__main__":
    setup_database()
