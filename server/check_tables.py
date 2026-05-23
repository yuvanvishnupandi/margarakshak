import pymysql

print("Checking tables in traffic_violation_db...")

connection = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    port=3306,
    connect_timeout=3,
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if len(tables) == 0:
            print("✗ No tables found! Creating tables...")
            
            # Create CITIZENS table
            cursor.execute("""
                CREATE TABLE CITIZENS (
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
            """)
            print("✓ Created CITIZENS table")
            
            # Create POLICE_OFFICERS table
            cursor.execute("""
                CREATE TABLE POLICE_OFFICERS (
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
            """)
            print("✓ Created POLICE_OFFICERS table")
            
            connection.commit()
        else:
            print(f"✓ Found {len(tables)} table(s):")
            for table in tables:
                table_name = list(table.values())[0]
                cursor.execute(f"DESCRIBE {table_name}")
                columns = cursor.fetchall()
                print(f"  • {table_name} ({len(columns)} columns)")
                
finally:
    connection.close()

print("\n✓ Database check complete!")
