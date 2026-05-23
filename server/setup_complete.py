"""
Complete Database Setup - Fixes MySQL auth and creates tables
"""
import mysql.connector
from mysql.connector import Error
import sys
import os

def run_setup():
    print("=" * 70)
    print("COMPLETE DATABASE SETUP FOR TRAFFIC VIOLATION SYSTEM")
    print("=" * 70)
    
    # Configuration
    host = '127.0.0.1'
    user = 'root'
    password = 'yvpandi@11'
    port = 3306
    db_name = 'traffic_violation_db'
    
    # Step 1: Connect without database
    print("\n[STEP 1] Connecting to MySQL server...")
    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            port=port,
            connection_timeout=5,
            auth_plugin='mysql_native_password'
        )
        print("✓ Connected to MySQL successfully")
    except Error as err:
        print(f"✗ MySQL connection error: {err}")
        print(f"\nERROR CODE: {err.errno}")
        
        if err.errno == 1045:
            print("\nFIX NEEDED: Wrong password or authentication plugin issue")
            print("Run this command in MySQL:")
            print("ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yvpandi@11';")
            print("FLUSH PRIVILEGES;")
        elif err.errno == 2003 or err.errno == 2002:
            print("\nFIX NEEDED: Cannot connect to MySQL server")
            print("1. Check if MySQL service is running")
            print("2. Check if port 3306 is correct")
        sys.exit(1)
    except Exception as e:
        print(f"✗ Unexpected error: {type(e).__name__}: {e}")
        sys.exit(1)
    
    cursor = conn.cursor()
    
    # Step 2: Create database
    print(f"\n[STEP 2] Creating database '{db_name}'...")
    try:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        print(f"✓ Database '{db_name}' created or already exists")
    except Error as e:
        print(f"✗ Failed to create database: {e}")
        cursor.close()
        conn.close()
        sys.exit(1)
    
    # Step 3: Use the database
    print(f"\n[STEP 3] Switching to database '{db_name}'...")
    cursor.execute(f"USE {db_name}")
    print("✓ Database selected")
    
    # Step 4: Create tables
    print("\n[STEP 4] Creating tables...")
    
    create_tables = [
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
    ]
    
    table_names = ['CITIZENS', 'POLICE_OFFICERS']
    
    for i, sql in enumerate(create_tables):
        try:
            cursor.execute(sql)
            print(f"✓ Table '{table_names[i]}' created successfully")
        except Error as e:
            print(f"✗ Failed to create table '{table_names[i]}': {e}")
    
    # Commit changes
    conn.commit()
    
    # Step 5: Verify
    print("\n[STEP 5] Verifying setup...")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"✓ Found {len(tables)} table(s):")
    for table in tables:
        cursor.execute(f"DESCRIBE {table[0]}")
        columns = cursor.fetchall()
        print(f"  • {table[0]} ({len(columns)} columns)")
    
    # Cleanup
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 70)
    print("✅ DATABASE SETUP COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Start your FastAPI backend: python -m uvicorn main:app --reload --port 5000")
    print("2. Start your frontend: npm run dev")
    print("3. Try creating an account - it should work now!")

if __name__ == "__main__":
    run_setup()
