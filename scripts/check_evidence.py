import pymysql
import os

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'cursorclass': pymysql.cursors.DictCursor
}

conn = pymysql.connect(**DB_CONFIG)
cursor = conn.cursor()

print("=" * 80)
print("Checking Evidence Photos in Database")
print("=" * 80)

# Get reports with evidence_path
cursor.execute('SELECT report_id, evidence_path FROM REPORTS WHERE evidence_path IS NOT NULL')
results = cursor.fetchall()

print(f"\nFound {len(results)} reports with evidence_path:\n")
for r in results:
    print(f"Report ID: {r['report_id']}")
    print(f"  Evidence Path: {r['evidence_path']}")
    
    # Check if file exists
    full_path = os.path.join("C:\\Users\\yuvan\\OneDrive\\Documents\\traffic_violation\\server", r['evidence_path'].lstrip('/'))
    print(f"  Full Path: {full_path}")
    print(f"  File Exists: {os.path.exists(full_path)}")
    print()

# Get total reports
cursor.execute('SELECT COUNT(*) as total FROM REPORTS')
total = cursor.fetchone()['total']
print(f"\nTotal Reports: {total}")
print(f"Reports with Evidence: {len(results)}")
print(f"Reports without Evidence: {total - len(results)}")

# Check uploads directory
uploads_dir = "C:\\Users\\yuvan\\OneDrive\\Documents\\traffic_violation\\server\\uploads\\evidence"
print(f"\nUploads Directory: {uploads_dir}")
print(f"Directory Exists: {os.path.exists(uploads_dir)}")

if os.path.exists(uploads_dir):
    files = os.listdir(uploads_dir)
    print(f"Files in directory: {len(files)}")
    if files:
        print("\nSample files:")
        for f in files[:5]:
            print(f"  - {f}")

conn.close()
