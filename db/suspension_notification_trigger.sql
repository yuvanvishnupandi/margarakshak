-- ============================================================================
-- AUTO-NOTIFICATION TRIGGER FOR ACCOUNT SUSPENSION
-- ============================================================================
-- When a citizen's trust_score drops to 0 and account_status changes to 'Suspended',
-- automatically insert a notification into the NOTIFICATIONS table.
-- ============================================================================

USE traffic_violation_db;

-- Drop trigger if exists (for re-runnable migration)
DROP TRIGGER IF EXISTS trg_suspension_notification;

DELIMITER $$

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
END$$

DELIMITER ;

-- Verify trigger creation
SELECT 'Suspension Notification Trigger Created Successfully!' AS status;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'traffic_violation_db' 
  AND TRIGGER_NAME = 'trg_suspension_notification';
