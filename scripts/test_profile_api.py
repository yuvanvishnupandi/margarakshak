"""
Test Profile API Endpoint
Run: python test_profile_api.py
"""
import requests
import jwt

# Login first to get token
login_data = {
    "email": "yuvan.reporter@gmail.com",
    "password": input("Enter password for yuvan.reporter@gmail.com: ")
}

print("\n[1] Logging in...")
login_res = requests.post("https://margarakshak-backend.onrender.com/api/auth/citizen/login", json=login_data)

if login_res.status_code != 200:
    print(f"❌ Login failed: {login_res.json()}")
    exit()

token_data = login_res.json()
token = token_data["token"]
print(f"✅ Login successful!")
print(f"Token: {token[:50]}...")

# Decode token to see user_id
payload = jwt.decode(token, "SECRET_KEY_FOR_JWT_TOKEN_GENERATION", algorithms=["HS256"])
print(f"User ID from token: {payload.get('sub')}")
print(f"Role from token: {payload.get('role')}")

# Test GET profile endpoint
print("\n[2] Fetching profile from /api/auth/profile...")
headers = {"Authorization": f"Bearer {token}"}
profile_res = requests.get("https://margarakshak-backend.onrender.com/api/auth/profile", headers=headers)

if profile_res.status_code == 200:
    profile = profile_res.json()
    print(f"✅ Profile fetched successfully!")
    print(f"\n📊 PROFILE DATA:")
    print(f"   Name: {profile.get('name')}")
    print(f"   Email: {profile.get('email')}")
    print(f"   Phone: {profile.get('phone_no')}")
    print(f"   Trust Score: {profile.get('trust_score')}")
    print(f"   Reward Points: {profile.get('reward_points')}")
    print(f"   Account Status: {profile.get('account_status')}")
    print(f"   Role: {profile.get('role')}")
else:
    print(f"❌ Failed to fetch profile: {profile_res.json()}")
