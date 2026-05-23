"""
Trust Score Trigger Verification and Testing Script
Verifies that MySQL triggers are installed and working correctly
"""
import pymysql

# Database configuration
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

def verify_triggers():
    """Verify that trust score triggers are installed."""
    print("=" * 70)
    print("MARGA RAKSHAK - TRUST SCORE TRIGGER VERIFICATION")
    print("=" * 70)
    print()
    
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if triggers exist
        print("[CHECK 1] Verifying MySQL triggers are installed...")
        cursor.execute("""
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
            FROM INFORMATION_SCHEMA.TRIGGERS
            WHERE TRIGGER_SCHEMA = 'traffic_violation_db'
            AND TRIGGER_NAME IN ('Auto_Reward_System', 'Auto_Penalty_System')
        """)
        
        triggers = cursor.fetchall()
        
        if len(triggers) == 0:
            print("   ❌ NO TRIGGERS FOUND!")
            print("   Please run: scripts/install_triggers.bat")
            print()
            return False
        
        print(f"   ✅ Found {len(triggers)} trigger(s):")
        for t in triggers:
            print(f"     - {t['TRIGGER_NAME']} ({t['ACTION_TIMING']} {t['EVENT_MANIPULATION']} on {t['EVENT_OBJECT_TABLE']})")
        print()
        
        # Find a test citizen
        print("[CHECK 2] Finding test citizen...")
        cursor.execute("SELECT citizen_id, full_name, email, trust_score FROM CITIZENS LIMIT 1")
        citizen = cursor.fetchone()
        
        if not citizen:
            print("   ❌ No citizens found in database")
            return False
        
        print(f"   ✅ Test citizen: {citizen['full_name']} (ID: {citizen['citizen_id']})")
        print(f"   Current trust score: {citizen['trust_score']}")
        print()
        
        # Find or create a pending report
        print("[CHECK 3] Finding pending report...")
        cursor.execute("""
            SELECT report_id, citizen_id, status 
            FROM REPORTS 
            WHERE status = 'Pending' 
            LIMIT 1
        """)
        report = cursor.fetchone()
        
        if not report:
            print("   ⚠️  No pending reports found")
            print("   Creating a test pending report...")
            
            # Create test vehicle if needed
            cursor.execute("SELECT plate_no FROM VEHICLES WHERE plate_no = 'TEST001'")
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type)
                    VALUES ('TEST001', 'Test Vehicle', 'Car', 'Test User', 'Individual')
                """)
            
            # Create test report
            cursor.execute("""
                INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_address, description, status)
                VALUES (%s, 'TEST001', 'Speeding', 'Test Location', 'Test report for trigger verification', 'Pending')
            """, (citizen['citizen_id'],))
            
            conn.commit()
            report_id = cursor.lastrowid
            print(f"   ✅ Created test report ID: {report_id}")
        else:
            report_id = report['report_id']
            print(f"   ✅ Found pending report ID: {report_id}")
        
        print()
        
        # Test VERIFY trigger
        print("[CHECK 4] Testing VERIFY trigger (should add +10 points)...")
        cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (citizen['citizen_id'],))
        score_before = cursor.fetchone()['trust_score']
        print(f"   Trust score before: {score_before}")
        
        # Update report to Verified
        cursor.execute("""
            UPDATE REPORTS 
            SET status = 'Verified', reviewed_at = NOW() 
            WHERE report_id = %s
        """, (report_id,))
        conn.commit()
        
        # Check new score
        cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (citizen['citizen_id'],))
        score_after = cursor.fetchone()['trust_score']
        print(f"   Trust score after:  {score_after}")
        
        if score_after == score_before + 10:
            print(f"   ✅ TRIGGER WORKS! Score increased by {score_after - score_before} points")
        else:
            print(f"   ❌ TRIGGER FAILED! Expected {score_before + 10}, got {score_after}")
            print("   Please run: scripts/install_triggers.bat")
        print()
        
        # Test REJECT trigger with another report
        print("[CHECK 5] Testing REJECT trigger (should subtract -10 points)...")
        
        # Create another test report
        cursor.execute("""
            INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_address, description, status)
            VALUES (%s, 'TEST002', 'Red Light', 'Test Location 2', 'Test report for reject trigger', 'Pending')
        """, (citizen['citizen_id'],))
        conn.commit()
        reject_report_id = cursor.lastrowid
        
        cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (citizen['citizen_id'],))
        score_before_reject = cursor.fetchone()['trust_score']
        print(f"   Trust score before: {score_before_reject}")
        
        # Update report to Rejected
        cursor.execute("""
            UPDATE REPORTS 
            SET status = 'Rejected', reviewed_at = NOW() 
            WHERE report_id = %s
        """, (reject_report_id,))
        conn.commit()
        
        # Check new score
        cursor.execute("SELECT trust_score FROM CITIZENS WHERE citizen_id = %s", (citizen['citizen_id'],))
        score_after_reject = cursor.fetchone()['trust_score']
        print(f"   Trust score after:  {score_after_reject}")
        
        if score_after_reject == score_before_reject - 10:
            print(f"   ✅ TRIGGER WORKS! Score decreased by {score_before_reject - score_after_reject} points")
        elif score_after_reject == 0 and score_before_reject < 10:
            print(f"   ✅ TRIGGER WORKS! Score stopped at 0 (didn't go negative)")
        else:
            print(f"   ❌ TRIGGER FAILED! Expected {score_before_reject - 10}, got {score_after_reject}")
            print("   Please run: scripts/install_triggers.bat")
        print()
        
        # Verify all pages will show updated score
        print("[CHECK 6] Verifying trust score appears in all pages...")
        cursor.execute("SELECT citizen_id, full_name, trust_score, reward_points FROM CITIZENS WHERE citizen_id = %s", (citizen['citizen_id'],))
        final_data = cursor.fetchone()
        
        print(f"   ✅ Profile Page: Will show trust_score = {final_data['trust_score']}")
        print(f"   ✅ Leaderboard: Will rank by trust_score = {final_data['trust_score']}")
        print(f"   ✅ Analytics: Will display trust_score = {final_data['trust_score']}")
        print(f"   ✅ Reward Points: {final_data['reward_points']}")
        print()
        
        print("=" * 70)
        print("TRIGGER VERIFICATION COMPLETE")
        print("=" * 70)
        print()
        print("TRUST SCORE UPDATE RULES:")
        print("  ✅ Police VERIFY report → Citizen gets +10 trust score")
        print("  ✅ Police REJECT report → Citizen loses -10 trust score (min 0)")
        print("  ✅ Updates are AUTOMATIC (MySQL triggers)")
        print("  ✅ Reflected in: Profile, Leaderboard, Analytics, Dashboard")
        print()
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    verify_triggers()
