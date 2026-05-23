"""Test appeal submission endpoint"""
import requests
import json

API_BASE_URL = "https://margarakshak-backend.onrender.com"

# Test appeal submission
appeal_data = {
    "challan_id": 10,
    "citizen_id": 1,
    "reason": "This is a test appeal to verify the endpoint is working correctly and not returning Not Found error message which is what we need to test"
}

print("Testing POST /api/appeals/submit...")
print(f"Payload: {json.dumps(appeal_data, indent=2)}")

try:
    response = requests.post(
        f"{API_BASE_URL}/api/appeals/submit",
        json=appeal_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Cannot connect to backend!")
    print("Make sure FastAPI server is running on port 5000")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
