import requests

print("Testing simple endpoint...")
try:
    r = requests.get('https://margarakshak-backend.onrender.com/api/health', timeout=5)
    print(f"Health check: {r.status_code} - {r.json()}")
except Exception as e:
    print(f"Health check failed: {e}")

print("\nTesting registration...")
try:
    r = requests.post(
        'https://margarakshak-backend.onrender.com/api/auth/citizen/register',
        json={
            "full_name": "Test User",
            "email": "test123@example.com",
            "phone_no": "9876543210",
            "password": "Test12345",
            "confirm_password": "Test12345"
        },
        timeout=10
    )
    print(f"Registration: {r.status_code}")
    print(r.json())
except Exception as e:
    print(f"Registration failed: {e}")
