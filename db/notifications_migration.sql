-- ============================================================================
-- NOTIFICATION SYSTEM MIGRATION
-- ============================================================================
-- Creates NOTIFICATIONS table and automatic triggers for report status changes
-- ============================================================================

USE traffic_violation_db;

-- 1. Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notif_id        INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    message         TEXT            NOT NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    notif_type      ENUM('Report Verified','Report Rejected','Challan Issued','Appeal Status','General') NOT NULL DEFAULT 'General',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_notif_citizen   (citizen_id),
    INDEX idx_notif_read      (is_read),
    INDEX idx_notif_type      (notif_type),
    INDEX idx_notif_created   (created_at)
) ENGINE=InnoDB;

-- 2. Drop existing trigger if exists (for re-runnable migration)
DROP TRIGGER IF EXISTS trg_report_notification;

DELIMITER $$

-- 3. Create notification trigger for report status changes
CREATE TRIGGER trg_report_notification
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status actually changes
    IF OLD.status <> NEW.status THEN
        -- Verified report notification
        IF NEW.status = 'Verified' THEN
            INSERT INTO NOTIFICATIONS (citizen_id, message, notif_type)
            VALUES (
                NEW.citizen_id, 
                CONCAT('Your report #', NEW.report_id, ' has been verified by police. Thank you for contributing to road safety!'),
                'Report Verified'
            );
        
        -- Rejected report notification
        ELSEIF NEW.status = 'Rejected' THEN
            INSERT INTO NOTIFICATIONS (citizen_id, message, notif_type)
            VALUES (
                NEW.citizen_id,
                CONCAT('Your report #', NEW.report_id, ' was rejected. Reason: ', COALESCE(NEW.rejection_reason, 'Insufficient evidence')),
                'Report Rejected'
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- 4. Verify migration
SELECT 'Notification System Migration Complete' AS status;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'traffic_violation_db' 
  AND TABLE_NAME = 'NOTIFICATIONS';

SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'traffic_violation_db' 
  AND TRIGGER_NAME = 'trg_report_notification';
