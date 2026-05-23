"""
Check Police Officers in Database
Run: python check_police_officers.py
"""
import pymysql

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

try:
    print("="*60)
    print("POLICE OFFICERS IN DATABASE")
    print("="*60)
    
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get all police officers
    cursor.execute("""
        SELECT badge_no, full_name, officer_rank, station_code, email, is_active
        FROM POLICE_OFFICERS
        ORDER BY badge_no
    """)
    
    officers = cursor.fetchall()
    
    if officers:
        print(f"\n✅ Found {len(officers)} police officer(s):\n")
        for i, officer in enumerate(officers, 1):
            status = "✓ Active" if officer['is_active'] else "✗ Deactivated"
            print(f"{i}. Badge: {officer['badge_no']}")
            print(f"   Name: {officer['full_name']}")
            print(f"   Rank: {officer['officer_rank']}")
            print(f"   Station: {officer['station_code']}")
            print(f"   Email: {officer['email']}")
            print(f"   Status: {status}")
            print()
    else:
        print("\n❌ NO POLICE OFFICERS FOUND IN DATABASE!")
        print("\nYou need to register a police officer first.")
        print("Go to: http://localhost:5173/police/register")
    
    cursor.close()
    conn.close()
    
    print("="*60)
    input("Press Enter to exit...")

except Exception as e:
    print(f"\n❌ DATABASE ERROR: {str(e)}")
    print("\nMake sure:")
    print("1. MySQL is running")
    print("2. Database 'traffic_violation_db' exists")
    input("\nPress Enter to exit...")
