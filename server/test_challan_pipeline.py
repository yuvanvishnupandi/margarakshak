import requests
import json

BASE_URL = 'https://margarakshak-backend.onrender.com'

print("=" * 60)
print("🧪 TESTING COMPLETE CHALLAN PIPELINE")
print("=" * 60)

# Test 1: Citizen Challans
print("\n📋 Test 1: Get Citizen Challans")
print("-" * 60)
res = requests.get(f'{BASE_URL}/api/challans/citizen/1')
print(f"Status: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    print(f"✅ Found {data['count']} challans")
    if data['challans']:
        challan = data['challans'][0]
        print(f"   Sample: Challan #{challan['challan_id']} - {challan['rule_name']} - ₹{challan['total_amount']} - {challan['payment_status']}")
else:
    print(f"Response: {res.text}")

# Test 2: Vehicle Search
print("\n🔍 Test 2: Search Vehicle")
print("-" * 60)
res = requests.get(f'{BASE_URL}/api/vehicles/search/MH01AB1234')
print(f"Status: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    vehicle = data['vehicle']
    summary = data['summary']
    print(f"✅ Vehicle: {vehicle['owner_name']} - {vehicle['vehicle_model']}")
    print(f"   Violations: {summary['total_violations']}, Unpaid: {summary['unpaid_challans']}, Due: ₹{summary['total_unpaid_amount']}")
else:
    print(f"Response: {res.json()['detail']}")

# Test 3: Pay Challan (if unpaid exists)
print("\n💳 Test 3: Pay Challan")
print("-" * 60)
res = requests.get(f'{BASE_URL}/api/challans/citizen/1')
if res.status_code == 200:
    challans = res.json()['challans']
    unpaid = [c for c in challans if c['payment_status'] == 'Unpaid']
    
    if unpaid:
        challan_id = unpaid[0]['challan_id']
        amount = unpaid[0]['total_amount']
        print(f"Paying Challan #{challan_id} (₹{amount})...")
        
        res = requests.put(f'{BASE_URL}/api/challans/pay/{challan_id}')
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            print(f"✅ Payment successful!")
            print(f"   {json.dumps(res.json(), indent=2)}")
        else:
            print(f"Response: {res.json()['detail']}")
    else:
        print("ℹ️  No unpaid challans found to test payment")

# Test 4: Process Report (Full Pipeline)
print("\n🔄 Test 4: Process Report (Verify + Create Challan)")
print("-" * 60)
# First get a pending report
res = requests.get(f'{BASE_URL}/api/reports/citizen/1')
if res.status_code == 200:
    reports = res.json()['reports']
    pending = [r for r in reports if r['status'] == 'Pending']
    
    if pending:
        report_id = pending[0]['report_id']
        print(f"Processing Report #{report_id}...")
        
        payload = {
            "status": "Verified",
            "rule_id": 1,  # Speeding rule
            "badge_no": "MH01POL999"
        }
        
        res = requests.put(
            f'{BASE_URL}/api/reports/police/process/{report_id}',
            json=payload
        )
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Report verified!")
            print(f"   Event ID: {data.get('event_id')}")
            print(f"   Challan ID: {data.get('challan_id')}")
            print(f"   Fine Amount: ₹{data.get('fine_amount')}")
        else:
            print(f"Response: {res.json()['detail']}")
    else:
        print("ℹ️  No pending reports found to test pipeline")

print("\n" + "=" * 60)
print("✅ ALL TESTS COMPLETED")
print("=" * 60)
