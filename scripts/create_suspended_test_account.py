"""
Create Suspended Test Account for Marga Rakshak System
Run this script to create a test citizen with trust_score=0 and account_status='Suspended'
"""
import pymysql
import bcrypt

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

# Test account credentials
TEST_EMAIL = "suspended.test@margarakshak.com"
TEST_PASSWORD = "Suspended@123"
TEST_NAME = "Suspended Test User"
TEST_PHONE = "9876543210"
TEST_PLATE = "TN04XX9999"

def hash_password(password: str) -> bytes:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def create_suspended_account():
    """Create a suspended test account in the database."""
    conn = None
    try:
        # Connect to database
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Hash the password
        password_hash = hash_password(TEST_PASSWORD)
        
        # Check if account already exists
        cursor.execute("SELECT citizen_id FROM CITIZENS WHERE email = %s", (TEST_EMAIL,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"⚠️  Account already exists with email: {TEST_EMAIL}")
            print(f"   Citizen ID: {existing['citizen_id']}")
            print(f"\n🔐 Login Credentials:")
            print(f"   Email: {TEST_EMAIL}")
            print(f"   Password: {TEST_PASSWORD}")
            return
        
        # Insert suspended citizen account
        cursor.execute(
            """INSERT INTO CITIZENS 
               (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                TEST_NAME,
                TEST_EMAIL,
                TEST_PHONE,
                password_hash,
                0,  # trust_score = 0 (triggers suspension)
                0,  # reward_points
                'Suspended'  # account_status
            )
        )
        
        citizen_id = cursor.lastrowid
        conn.commit()
        
        print("=" * 60)
        print("✅ SUSPENDED TEST ACCOUNT CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\n👤 Account Details:")
        print(f"   Citizen ID: {citizen_id}")
        print(f"   Name: {TEST_NAME}")
        print(f"   Email: {TEST_EMAIL}")
        print(f"   Phone: {TEST_PHONE}")
        print(f"   Vehicle Plate: {TEST_PLATE}")
        print(f"\n🔐 Login Credentials:")
        print(f"   Email: {TEST_EMAIL}")
        print(f"   Password: {TEST_PASSWORD}")
        print(f"\n⚠️  Account Status:")
        print(f"   Trust Score: 0")
        print(f"   Account Status: Suspended")
        print(f"\n🎯 Testing Instructions:")
        print(f"   1. Login with the credentials above")
        print(f"   2. Navigate to 'Submit Report' page")
        print(f"   3. You should see a RED ALERT BANNER")
        print(f"   4. The submission form should be HIDDEN")
        print("=" * 60)
        
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.open:
            conn.close()

if __name__ == "__main__":
    create_suspended_account()
