"""
Quick test to verify registration endpoint works
"""
import requests
import json

print("Testing Citizen Registration Endpoint...")
print("=" * 60)

# Test data
test_user = {
    "full_name": "Test User",
    "email": "testuser@example.com",
    "phone_no": "9876543210",
    "password": "TestPass123",
    "confirm_password": "TestPass123"
}

try:
    response = requests.post(
        'http://localhost:5000/api/auth/citizen/register',
        json=test_user,
        timeout=10
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Registration endpoint is working!")
    else:
        print(f"\n⚠️ Registration returned status {response.status_code}")
        
except requests.exceptions.Timeout:
    print("\n✗ TIMEOUT! The request took too long (froze)")
except requests.exceptions.ConnectionError:
    print("\n✗ CONNECTION ERROR! Backend server is not running")
except Exception as e:
    print(f"\n✗ Error: {type(e).__name__}: {e}")
