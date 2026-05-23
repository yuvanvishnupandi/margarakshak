import pymysql

print("Installing database triggers...")

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='yvpandi@11',
    database='traffic_violation_db',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:
        # Drop existing triggers if they exist
        cursor.execute("DROP TRIGGER IF EXISTS Auto_Reward_System")
        cursor.execute("DROP TRIGGER IF EXISTS Auto_Penalty_System")
        print("✓ Dropped existing triggers")
        
        # Create Auto-Reward System trigger
        cursor.execute("""
            CREATE TRIGGER Auto_Reward_System
            AFTER UPDATE ON REPORTS
            FOR EACH ROW
            BEGIN
                IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
                    UPDATE CITIZENS
                    SET trust_score = trust_score + 10,
                        reward_points = reward_points + 10
                    WHERE citizen_id = NEW.citizen_id;
                END IF;
            END
        """)
        print("✓ Created Auto_Reward_System trigger")
        
        # Create Auto-Penalty System trigger
        cursor.execute("""
            CREATE TRIGGER Auto_Penalty_System
            AFTER UPDATE ON REPORTS
            FOR EACH ROW
            BEGIN
                IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
                    UPDATE CITIZENS
                    SET trust_score = GREATEST(trust_score - 10, 0)
                    WHERE citizen_id = NEW.citizen_id;
                END IF;
            END
        """)
        print("✓ Created Auto_Penalty_System trigger")
        
        conn.commit()
        
        # Verify triggers
        cursor.execute("""
            SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
            FROM INFORMATION_SCHEMA.TRIGGERS
            WHERE TRIGGER_SCHEMA = 'traffic_violation_db'
            AND TRIGGER_NAME IN ('Auto_Reward_System', 'Auto_Penalty_System')
        """)
        triggers = cursor.fetchall()
        
        print(f"\n✅ Installed {len(triggers)} triggers:")
        for t in triggers:
            print(f"  • {t['TRIGGER_NAME']} ({t['ACTION_TIMING']} {t['EVENT_MANIPULATION']})")
        
except Exception as e:
    print(f"\n✗ Error: {e}")
    conn.rollback()
finally:
    conn.close()
