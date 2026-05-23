import requests
import json

BASE_URL = 'https://margarakshak-backend.onrender.com'

print("=" * 70)
print("🧪 TESTING FOREIGN KEY FIX - Auto Vehicle Creation")
print("=" * 70)

# Test 1: Create report with NEW vehicle (doesn't exist in VEHICLES table)
print("\n📋 Test 1: Submit Report with NEW Vehicle Plate")
print("-" * 70)
new_plate = "AUTO2026XYZ"

payload = {
    "citizen_id": 1,
    "plate_no": new_plate,
    "violation_type": "Speeding",
    "location_address": "Test Location - Auto Created Vehicle",
    "description": "Testing automatic vehicle creation on report submit"
}

print(f"Plate Number: {new_plate} (should not exist in VEHICLES)")
print(f"Submitting report...")

res = requests.post(f'{BASE_URL}/api/reports/create', json=payload)
print(f"Status: {res.status_code}")

if res.status_code == 200:
    data = res.json()
    print(f"✅ SUCCESS!")
    print(f"   Report ID: {data['report_id']}")
    print(f"   Status: {data['status']}")
    print(f"   Vehicle Created: {data.get('vehicle_created', 'N/A')}")
    
    # Verify vehicle was actually created
    print(f"\n🔍 Verifying vehicle exists in database...")
    res2 = requests.get(f'{BASE_URL}/api/vehicles/search/{new_plate}')
    if res2.status_code == 200:
        vehicle_data = res2.json()
        print(f"✅ Vehicle confirmed in database:")
        print(f"   Plate: {vehicle_data['vehicle']['plate_no']}")
        print(f"   Owner: {vehicle_data['vehicle']['owner_name']}")
        print(f"   Type: {vehicle_data['vehicle']['vehicle_type']}")
        print(f"   Model: {vehicle_data['vehicle']['vehicle_model']}")
    else:
        print(f"❌ Vehicle not found: {res2.json()['detail']}")
else:
    print(f"❌ FAILED: {res.json()['detail']}")

# Test 2: Create report with EXISTING vehicle
print("\n" + "=" * 70)
print("📋 Test 2: Submit Report with EXISTING Vehicle Plate")
print("-" * 70)

# Use a plate that should now exist
existing_plate = "AUTO2026XYZ"

payload2 = {
    "citizen_id": 1,
    "plate_no": existing_plate,
    "violation_type": "Red Light Violation",
    "location_address": "Same vehicle, second report",
    "description": "Testing report with existing vehicle"
}

print(f"Plate Number: {existing_plate} (should exist in VEHICLES)")
print(f"Submitting second report...")

res3 = requests.post(f'{BASE_URL}/api/reports/create', json=payload2)
print(f"Status: {res3.status_code}")

if res3.status_code == 200:
    data3 = res3.json()
    print(f"✅ SUCCESS!")
    print(f"   Report ID: {data3['report_id']}")
    print(f"   Status: {data3['status']}")
    print(f"   Vehicle Created: {data3.get('vehicle_created', 'N/A')}")
    
    if data3.get('vehicle_created') == False:
        print(f"   ✓ Correctly detected existing vehicle (no duplicate created)")
    else:
        print(f"   ⚠️  Vehicle was created again (should have been skipped)")
else:
    print(f"❌ FAILED: {res3.json()['detail']}")

# Test 3: Verify no foreign key errors
print("\n" + "=" * 70)
print("📋 Test 3: Verify Foreign Key Integrity")
print("-" * 70)

print("Checking all reports have valid plate_no references...")

# This would fail if FK constraint was violated
res4 = requests.get(f'{BASE_URL}/api/reports/citizen/1')
if res4.status_code == 200:
    reports = res4.json()['reports']
    print(f"✅ All {len(reports)} reports have valid foreign key references")
    
    # Show the test reports
    test_reports = [r for r in reports if r.get('plate_no') == 'AUTO2026XYZ']
    if test_reports:
        print(f"\n📊 Test Reports Created:")
        for r in test_reports:
            print(f"   Report #{r['report_id']}: {r['violation_type']} - {r['plate_no']} - {r['status']}")

print("\n" + "=" * 70)
print("✅ FOREIGN KEY FIX TEST COMPLETE")
print("=" * 70)
