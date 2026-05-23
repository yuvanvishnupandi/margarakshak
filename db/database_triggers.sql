-- ==========================================
-- TRAFFIC VIOLATION DBMS - NATIVE MYSQL TRIGGERS
-- Auto-Reward and Auto-Penalty System
-- ==========================================

DELIMITER $$

-- Trigger 1: Auto-Reward System
-- When a report is verified, add 10 points to citizen's trust score
CREATE TRIGGER IF NOT EXISTS Auto_Reward_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Verified
    IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
        UPDATE CITIZENS
        SET trust_score = trust_score + 10,
            reward_points = reward_points + 10
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

-- Trigger 2: Auto-Penalty System
-- When a report is rejected, subtract 10 points from citizen's trust score
CREATE TRIGGER IF NOT EXISTS Auto_Penalty_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Rejected
    IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
        UPDATE CITIZENS
        SET trust_score = GREATEST(trust_score - 10, 0)  -- Don't go below 0
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

DELIMITER ;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if triggers were created
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'traffic_violation_db'
AND TRIGGER_NAME IN ('Auto_Reward_System', 'Auto_Penalty_System');
