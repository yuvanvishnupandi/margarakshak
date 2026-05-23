"""
Test that suspended users CANNOT submit reports
"""
import requests
import json

API_BASE_URL = "https://margarakshak-backend.onrender.com"

def test_suspended_user_blocked():
    """Verify that suspended users are blocked from submitting reports."""
    
    print("=" * 70)
    print("🧪 TESTING: Suspended User Report Submission Block")
    print("=" * 70)
    
    # Test data - attempt to submit a report as reckless user (citizen_id: 17)
    report_data = {
        "citizen_id": 17,  # reckless@test.com (SUSPENDED)
        "plate_no": "TN04XX1234",
        "violation_type": "Speeding",
        "location_coords": "13.0827,80.2707",
        "location_address": "T. Nagar, Chennai",
        "description": "Testing if suspended users are blocked"
    }
    
    print(f"\n📝 Attempting to submit report as:")
    print(f"   Citizen ID: {report_data['citizen_id']}")
    print(f"   Account Status: SUSPENDED")
    print(f"   Trust Score: 0")
    print(f"\n📤 Sending POST request to /api/reports/create...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/reports/create",
            json=report_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        print(f"📡 Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 403:
            print("\n" + "=" * 70)
            print("✅ SUCCESS! Suspended user is BLOCKED from submitting reports!")
            print("=" * 70)
            print(f"\n🚫 Backend returned 403 FORBIDDEN")
            print(f"📝 Error message: {response.json()['detail']}")
            print("\n✅ The suspension enforcement is working correctly!")
            print("=" * 70)
            return True
        else:
            print("\n" + "=" * 70)
            print("❌ FAIL! Suspended user was able to submit report!")
            print("=" * 70)
            print(f"\n⚠️  Backend returned {response.status_code}")
            print(f"⚠️  Expected: 403 FORBIDDEN")
            print("\n❌ The suspension enforcement is NOT working!")
            print("=" * 70)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend!")
        print("   Make sure the FastAPI server is running on port 5000")
        print("   Run: cd server && python main.py")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

def test_active_user_allowed():
    """Verify that active users CAN submit reports."""
    
    print("\n\n" + "=" * 70)
    print("🧪 TESTING: Active User Report Submission (Should Succeed)")
    print("=" * 70)
    
    # Test data - attempt to submit a report as active user (citizen_id: 1)
    report_data = {
        "citizen_id": 1,  # Active user
        "plate_no": "TN04XX5678",
        "violation_type": "No Helmet",
        "location_coords": "13.0850,80.2750",
        "location_address": "Adyar, Chennai",
        "description": "Testing if active users can still submit reports"
    }
    
    print(f"\n📝 Attempting to submit report as:")
    print(f"   Citizen ID: {report_data['citizen_id']}")
    print(f"   Account Status: Active (presumably)")
    print(f"\n📤 Sending POST request to /api/reports/create...")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/reports/create",
            json=report_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        print(f"📡 Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n" + "=" * 70)
            print("✅ SUCCESS! Active user can submit reports!")
            print("=" * 70)
            print(f"\n✅ Backend returned 200 OK")
            print(f"📝 Report ID: {response.json()['report_id']}")
            print("\n✅ Active users are not affected by the suspension check!")
            print("=" * 70)
            return True
        else:
            print("\n" + "=" * 70)
            print("⚠️  WARNING! Active user got unexpected response!")
            print("=" * 70)
            print(f"\n⚠️  Backend returned {response.status_code}")
            print(f"⚠️  Expected: 200 OK")
            print("=" * 70)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend!")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("\n🚀 RUNNING SUSPENSION ENFORCEMENT TESTS\n")
    
    # Test 1: Suspended user should be BLOCKED
    test1_passed = test_suspended_user_blocked()
    
    # Test 2: Active user should be ALLOWED
    test2_passed = test_active_user_allowed()
    
    # Summary
    print("\n\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    print(f"\nTest 1 - Suspended User Blocked: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Test 2 - Active User Allowed:    {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print("\n" + "=" * 70)
    
    if test1_passed and test2_passed:
        print("🎉 ALL TESTS PASSED! Suspension enforcement is working perfectly!")
    else:
        print("⚠️  Some tests failed. Please check the output above.")
    print("=" * 70)
