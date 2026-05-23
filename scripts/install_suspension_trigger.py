"""
Install the suspension notification trigger
"""
import pymysql

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

def install_trigger():
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Drop existing trigger
        cursor.execute("DROP TRIGGER IF EXISTS trg_suspension_notification")
        
        # Create the trigger
        trigger_sql = """
        CREATE TRIGGER trg_suspension_notification
        AFTER UPDATE ON CITIZENS
        FOR EACH ROW
        BEGIN
            -- Only trigger when account is newly suspended
            IF NEW.trust_score <= 0 AND NEW.account_status = 'Suspended' AND OLD.account_status != 'Suspended' THEN
                -- Insert suspension notification
                INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read, created_at)
                VALUES (
                    NEW.citizen_id,
                    'Account Suspended',
                    CONCAT('Your account has been suspended due to low trust score (', NEW.trust_score, '). Reporting features are now disabled. Please contact the traffic department to appeal.'),
                    FALSE,
                    NOW()
                );
            END IF;
            
            -- Also notify if trust score is critically low (warning)
            IF NEW.trust_score <= 10 AND NEW.trust_score > 0 AND OLD.trust_score > 10 THEN
                INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message, is_read, created_at)
                VALUES (
                    NEW.citizen_id,
                    'Trust Score Warning',
                    CONCAT('Warning: Your trust score has dropped to ', NEW.trust_score, '. If it reaches 0, your account will be suspended.'),
                    FALSE,
                    NOW()
                );
            END IF;
        END
        """
        
        cursor.execute(trigger_sql)
        conn.commit()
        
        print("=" * 70)
        print("✅ SUSPENSION NOTIFICATION TRIGGER INSTALLED SUCCESSFULLY!")
        print("=" * 70)
        print("\n📋 What this trigger does:")
        print("   1. When trust_score drops to 0 → Creates 'Account Suspended' notification")
        print("   2. When trust_score drops to ≤10 → Creates 'Trust Score Warning' notification")
        print("   3. Notifications appear instantly in user's notification bell")
        print("\n🧪 To test:")
        print("   UPDATE CITIZENS SET trust_score = 0 WHERE email = 'reckless@test.com';")
        print("   Then login and check notification bell!")
        print("=" * 70)
        
        # Verify trigger exists
        cursor.execute(
            "SELECT TRIGGER_NAME FROM INFORMATION_SCHEMA.TRIGGERS WHERE TRIGGER_SCHEMA = 'traffic_violation_db' AND TRIGGER_NAME = 'trg_suspension_notification'"
        )
        result = cursor.fetchone()
        if result:
            print(f"\n✅ Verified: Trigger '{result['TRIGGER_NAME']}' exists in database")
        
    except pymysql.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn and conn.open:
            conn.close()

if __name__ == "__main__":
    install_trigger()
