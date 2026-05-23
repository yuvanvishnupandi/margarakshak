import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='yuvz2006',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:
        print("="*80)
        print("TRUST SCORE DIAGNOSTIC REPORT")
        print("="*80)
        
        # 1. Check if trigger exists
        print("\n1. Checking if trigger exists...")
        cursor.execute("SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust'")
        trigger = cursor.fetchone()
        
        if trigger:
            print("✅ Trigger 'trg_report_status_trust' EXISTS")
            print(f"   Table: {trigger['Table']}")
            print(f"   Event: {trigger['Event']}")
            print(f"   Timing: {trigger['Timing']}")
        else:
            print("❌ Trigger 'trg_report_status_trust' DOES NOT EXIST!")
            print("   This is why trust score is not updating!")
        
        # 2. Check citizen's trust score
        print("\n2. Checking citizen trust scores...")
        cursor.execute("SELECT citizen_id, full_name, email, trust_score, reward_points FROM CITIZENS LIMIT 5")
        citizens = cursor.fetchall()
        
        for c in citizens:
            print(f"   ID: {c['citizen_id']}, Name: {c['full_name']}, Trust: {c['trust_score']}, Rewards: {c['reward_points']}")
        
        # 3. Check reports and their status
        print("\n3. Checking recent reports...")
        cursor.execute("""
            SELECT r.report_id, r.citizen_id, r.status, r.date_reported,
                   c.full_name, c.trust_score
            FROM REPORTS r
            JOIN CITIZENS c ON r.citizen_id = c.citizen_id
            ORDER BY r.date_reported DESC
            LIMIT 10
        """)
        reports = cursor.fetchall()
        
        for r in reports:
            print(f"   Report #{r['report_id']}, Citizen: {r['full_name']}, Status: {r['status']}, Trust: {r['trust_score']}")
        
        # 4. Check if any reports were verified
        print("\n4. Checking verified reports...")
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM REPORTS 
            WHERE status = 'Verified'
        """)
        verified_count = cursor.fetchone()['count']
        print(f"   Total verified reports: {verified_count}")
        
        if verified_count > 0:
            print("\n   Sample verified reports:")
            cursor.execute("""
                SELECT r.report_id, r.citizen_id, r.status, c.trust_score
                FROM REPORTS r
                JOIN CITIZENS c ON r.citizen_id = c.citizen_id
                WHERE r.status = 'Verified'
                LIMIT 5
            """)
            for r in cursor.fetchall():
                print(f"   Report #{r['report_id']}, Citizen ID: {r['citizen_id']}, Trust Score: {r['trust_score']}")
        
        # 5. Test: Manually update a report status to see if trigger fires
        print("\n5. Testing trigger functionality...")
        cursor.execute("""
            SELECT report_id, citizen_id, status 
            FROM REPORTS 
            WHERE status = 'Pending'
            LIMIT 1
        """)
        pending_report = cursor.fetchone()
        
        if pending_report:
            print(f"   Found pending report #{pending_report['report_id']}")
            
            # Get citizen's current trust score
            cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (pending_report['citizen_id'],))
            before_score = cursor.fetchone()['trust_score']
            print(f"   Citizen {pending_report['citizen_id']} trust score BEFORE: {before_score}")
            
            # Update report status to Verified
            cursor.execute("""
                UPDATE REPORTS 
                SET status = 'Verified', reviewed_at = NOW()
                WHERE report_id = %s
            """, (pending_report['report_id'],))
            conn.commit()
            
            # Check trust score after
            cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (pending_report['citizen_id'],))
            after_score = cursor.fetchone()['trust_score']
            print(f"   Citizen {pending_report['citizen_id']} trust score AFTER: {after_score}")
            
            if after_score > before_score:
                print(f"   ✅ Trigger WORKS! Trust score increased by {after_score - before_score}")
            else:
                print(f"   ❌ Trigger NOT WORKING! Trust score didn't change")
            
            # Revert the change
            cursor.execute("""
                UPDATE REPORTS 
                SET status = 'Pending', reviewed_at = NULL
                WHERE report_id = %s
            """, (pending_report['report_id'],))
            conn.commit()
            print(f"   Reverted report status back to Pending")
        else:
            print("   No pending reports found to test with")
        
        # 6. Show trigger creation SQL if it doesn't exist
        if not trigger:
            print("\n" + "="*80)
            print("TRIGGER NEEDS TO BE CREATED!")
            print("="*80)
            print("\nRun this SQL in MySQL Workbench:")
            print("\n".join([
                "USE traffic_violation_db;",
                "",
                "DROP TRIGGER IF EXISTS trg_report_status_trust;",
                "",
                "DELIMITER $$",
                "",
                "CREATE TRIGGER trg_report_status_trust",
                "AFTER UPDATE ON REPORTS",
                "FOR EACH ROW",
                "BEGIN",
                "    IF OLD.status <> NEW.status THEN",
                "        IF NEW.status = 'Verified' THEN",
                "            UPDATE CITIZENS",
                "            SET trust_score   = LEAST(trust_score + 10, 200),",
                "                reward_points = reward_points + 5",
                "            WHERE citizen_id  = NEW.citizen_id;",
                "",
                "        ELSEIF NEW.status = 'Rejected' THEN",
                "            UPDATE CITIZENS",
                "            SET trust_score = GREATEST(trust_score - 10, 0)",
                "            WHERE citizen_id = NEW.citizen_id;",
                "        END IF;",
                "    END IF;",
                "END$$",
                "",
                "DELIMITER ;"
            ]))
        
        print("\n" + "="*80)
        print("DIAGNOSTIC COMPLETE")
        print("="*80)
        
finally:
    conn.close()
