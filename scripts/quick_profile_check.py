"""
Quick Profile Diagnostic - Check what API returns
Run: python quick_profile_check.py
"""
import pymysql
import requests
import jwt

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

JWT_SECRET = "tvms-super-secret-key-2025"

email = "yuvan.reporter@gmail.com"

print("="*60)
print("PROFILE DIAGNOSTIC TOOL")
print("="*60)

# Step 1: Check database directly
print(f"\n[1] Checking database for {email}...")
conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("""
    SELECT citizen_id, full_name, email, phone_no, trust_score, reward_points, account_status
    FROM CITIZENS
    WHERE email = %s
""", (email,))

db_user = cursor.fetchone()

if db_user:
    print(f"✅ User found in database:")
    print(f"   Citizen ID: {db_user['citizen_id']}")
    print(f"   Name: {db_user['full_name']}")
    print(f"   Email: {db_user['email']}")
    print(f"   Phone: {db_user['phone_no']}")
    print(f"   Trust Score: {db_user['trust_score']}")
    print(f"   Reward Points: {db_user['reward_points']}")
    print(f"   Account Status: {db_user['account_status']}")
else:
    print(f"❌ User NOT FOUND in database!")
    conn.close()
    exit()

conn.close()

# Step 2: Login and get token
print(f"\n[2] Logging in to get JWT token...")
print("Enter your password:")
password = input("> ").strip()

login_res = requests.post("http://localhost:5000/api/auth/citizen/login", json={
    "email": email,
    "password": password
})

if login_res.status_code != 200:
    print(f"❌ Login failed: {login_res.json()}")
    exit()

token = login_res.json()["token"]
print(f"✅ Login successful!")

# Decode token
payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
user_id = payload.get("sub")
print(f"   User ID in token: {user_id}")
print(f"   Role in token: {payload.get('role')}")

# Step 3: Call profile API
print(f"\n[3] Calling GET /api/auth/profile...")
headers = {"Authorization": f"Bearer {token}"}
profile_res = requests.get("http://localhost:5000/api/auth/profile", headers=headers)

if profile_res.status_code == 200:
    profile = profile_res.json()
    print(f"✅ API returned profile:")
    print(f"   ID: {profile.get('id')}")
    print(f"   Name: {profile.get('name')}")
    print(f"   Email: {profile.get('email')}")
    print(f"   Phone: {profile.get('phone_no')}")
    print(f"   Trust Score: {profile.get('trust_score')}")
    print(f"   Reward Points: {profile.get('reward_points')}")
    print(f"   Role: {profile.get('role')}")
    
    # Compare with database
    print(f"\n[4] Comparison:")
    print(f"   Database trust_score: {db_user['trust_score']}")
    print(f"   API trust_score:      {profile.get('trust_score')}")
    
    if db_user['trust_score'] == profile.get('trust_score'):
        print(f"   ✅ MATCH! API is returning correct data.")
    else:
        print(f"   ❌ MISMATCH! API is returning wrong data!")
        print(f"   This is the BUG - API should return {db_user['trust_score']} but returns {profile.get('trust_score')}")
else:
    print(f"❌ API call failed: {profile_res.json()}")

print("\n" + "="*60)
print("DIAGNOSTIC COMPLETE")
print("="*60)
