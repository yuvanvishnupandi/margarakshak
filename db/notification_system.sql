-- ============================================================================
-- NOTIFICATION SYSTEM & REJECTION TRACKING
-- Tracks report rejections, sends warnings, and manages temporary bans
-- ============================================================================

USE traffic_violation_db;

-- 1. Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notification_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id        INT             NOT NULL,
    notification_type ENUM('Warning', 'Rejection', 'Ban', 'TrustUpdate', 'Reward', 'Info') NOT NULL,
    title             VARCHAR(200)    NOT NULL,
    message           TEXT            NOT NULL,
    is_read           BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at           DATETIME        DEFAULT NULL,
    CONSTRAINT fk_notification_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_notification_citizen (citizen_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (notification_type)
) ENGINE=InnoDB;

-- 2. Add rejection tracking columns to CITIZENS
ALTER TABLE CITIZENS 
ADD COLUMN IF NOT EXISTS consecutive_rejections INT NOT NULL DEFAULT 0 COMMENT 'Count of consecutive rejected reports',
ADD COLUMN IF NOT EXISTS total_rejections INT NOT NULL DEFAULT 0 COMMENT 'Total lifetime rejections',
ADD COLUMN IF NOT EXISTS ban_until DATETIME DEFAULT NULL COMMENT 'Account banned until this date',
ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(500) DEFAULT NULL COMMENT 'Reason for ban';

-- 3. Enhanced trigger for report status changes with notifications
DELIMITER $$

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trg_report_status_trust$$

-- Create enhanced trigger
CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_rejection_count INT DEFAULT 0;
    DECLARE v_total_rejections INT DEFAULT 0;
    DECLARE v_ban_days INT DEFAULT 0;
    DECLARE v_warning_msg VARCHAR(500);
    
    IF OLD.status <> NEW.status THEN
        -- Report VERIFIED
        IF NEW.status = 'Verified' THEN
            -- Increase trust score and rewards
            UPDATE CITIZENS
            SET trust_score   = LEAST(trust_score + 10, 200),
                reward_points = reward_points + 5,
                consecutive_rejections = 0  -- Reset consecutive rejections
            WHERE citizen_id  = NEW.citizen_id;
            
            -- Insert notification
            INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
            VALUES (
                NEW.citizen_id,
                'TrustUpdate',
                'Report Verified - Trust Score Increased!',
                CONCAT('Your report #', NEW.report_id, ' has been verified. Trust score increased by 10 points. Reward points: +5')
            );

        -- Report REJECTED
        ELSEIF NEW.status = 'Rejected' THEN
            -- Get current rejection count
            SELECT consecutive_rejections, total_rejections 
            INTO v_rejection_count, v_total_rejections
            FROM CITIZENS 
            WHERE citizen_id = NEW.citizen_id;
            
            -- Increment rejection counts
            SET v_rejection_count = v_rejection_count + 1;
            SET v_total_rejections = v_total_rejections + 1;
            
            -- Decrease trust score
            UPDATE CITIZENS
            SET trust_score  = GREATEST(trust_score - 10, 0),
                consecutive_rejections = v_rejection_count,
                total_rejections = v_total_rejections
            WHERE citizen_id = NEW.citizen_id;
            
            -- Determine ban based on consecutive rejections
            IF v_rejection_count >= 10 THEN
                -- 10+ consecutive rejections: Permanent ban
                SET v_ban_days = 999999;
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. This is your ', v_rejection_count, ' consecutive rejection. Your account has been PERMANENTLY BANNED due to excessive false reports.');
                
                UPDATE CITIZENS
                SET ban_until = DATE_ADD(NOW(), INTERVAL 999999 DAY),
                    ban_reason = 'Permanent ban: 10+ consecutive false reports'
                WHERE citizen_id = NEW.citizen_id;
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Ban', 'ACCOUNT PERMANENTLY BANNED', v_warning_msg);
                
            ELSEIF v_rejection_count >= 7 THEN
                -- 7-9 consecutive rejections: 30 days ban
                SET v_ban_days = 30;
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. This is your ', v_rejection_count, ' consecutive rejection. Your account is banned for 30 days. If this continues, your account will be permanently banned.');
                
                UPDATE CITIZENS
                SET ban_until = DATE_ADD(NOW(), INTERVAL 30 DAY),
                    ban_reason = '30-day ban: 7+ consecutive false reports'
                WHERE citizen_id = NEW.citizen_id;
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Ban', 'Account Banned for 30 Days', v_warning_msg);
                
            ELSEIF v_rejection_count >= 5 THEN
                -- 5-6 consecutive rejections: 14 days ban
                SET v_ban_days = 14;
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. This is your ', v_rejection_count, ' consecutive rejection. Your account is banned for 14 days. Further rejections will result in longer bans.');
                
                UPDATE CITIZENS
                SET ban_until = DATE_ADD(NOW(), INTERVAL 14 DAY),
                    ban_reason = '14-day ban: 5+ consecutive false reports'
                WHERE citizen_id = NEW.citizen_id;
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Ban', 'Account Banned for 14 Days', v_warning_msg);
                
            ELSEIF v_rejection_count >= 3 THEN
                -- 3-4 consecutive rejections: 7 days ban
                SET v_ban_days = 7;
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. This is your ', v_rejection_count, ' consecutive rejection. Your account is banned for 7 days. If this continues, you will face longer bans.');
                
                UPDATE CITIZENS
                SET ban_until = DATE_ADD(NOW(), INTERVAL 7 DAY),
                    ban_reason = '7-day ban: 3+ consecutive false reports'
                WHERE citizen_id = NEW.citizen_id;
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Ban', 'Account Banned for 7 Days', v_warning_msg);
                
            ELSEIF v_rejection_count = 2 THEN
                -- 2 consecutive rejections: Warning
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. This is your 2nd consecutive rejection. One more rejection will result in a 7-day ban. Please ensure reports are accurate.');
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Warning', 'Warning: 2 Consecutive Rejections', v_warning_msg);
                
            ELSE
                -- 1st rejection: Info notification
                SET v_warning_msg = CONCAT('Your report #', NEW.report_id, ' was rejected. Trust score decreased by 10 points. Please ensure future reports are accurate.');
                
                INSERT INTO NOTIFICATIONS (citizen_id, notification_type, title, message)
                VALUES (NEW.citizen_id, 'Rejection', 'Report Rejected', v_warning_msg);
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- 4. Create view for citizen notifications
CREATE OR REPLACE VIEW CITIZEN_NOTIFICATIONS AS
SELECT 
    n.notification_id,
    n.citizen_id,
    c.full_name,
    c.email,
    n.notification_type,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    n.read_at
FROM NOTIFICATIONS n
JOIN CITIZENS c ON n.citizen_id = c.citizen_id
ORDER BY n.created_at DESC;

-- 5. Stored procedure to get citizen notifications
DELIMITER $$
CREATE PROCEDURE sp_get_citizen_notifications(
    IN p_citizen_id INT,
    IN p_limit INT
)
BEGIN
    SELECT 
        notification_id,
        notification_type,
        title,
        message,
        is_read,
        created_at,
        read_at
    FROM NOTIFICATIONS
    WHERE citizen_id = p_citizen_id
    ORDER BY created_at DESC
    LIMIT p_limit;
END$$

-- 6. Stored procedure to mark notification as read
DELIMITER $$
CREATE PROCEDURE sp_mark_notification_read(
    IN p_notification_id INT,
    IN p_citizen_id INT
)
BEGIN
    UPDATE NOTIFICATIONS
    SET is_read = TRUE,
        read_at = NOW()
    WHERE notification_id = p_notification_id
    AND citizen_id = p_citizen_id;
END$$

DELIMITER ;

-- 7. Add index for performance
CREATE INDEX idx_notification_created ON NOTIFICATIONS(created_at DESC);
CREATE INDEX idx_citizen_ban ON CITIZENS(ban_until);

SELECT 'Notification system and ban tracking created successfully!' AS status;
