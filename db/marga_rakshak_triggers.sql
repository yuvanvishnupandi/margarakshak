-- ==========================================
-- MARGA RAKSHAK DBMS - COMPLETE TRIGGER SYSTEM
-- Auto-Reward & Auto-Penalty for Trust Score Management
-- ==========================================

DELIMITER $$

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS Auto_Reward_System$$
DROP TRIGGER IF EXISTS Auto_Penalty_System$$

-- ==========================================
-- TRIGGER 1: Auto-Reward System
-- When a report is VERIFIED, add +10 to citizen's trust score
-- ==========================================
CREATE TRIGGER Auto_Reward_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Verified
    IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
        UPDATE CITIZENS
        SET trust_score        = LEAST(trust_score + 10, 200),
            reward_points     = reward_points + 10,
            reports_submitted = reports_submitted + 1
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

-- ==========================================
-- TRIGGER 2: Auto-Penalty System  
-- When a report is REJECTED, subtract -10 from citizen's trust score
-- ==========================================
CREATE TRIGGER Auto_Penalty_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes from Pending to Rejected
    IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
        UPDATE CITIZENS
        SET trust_score = GREATEST(trust_score - 10, 0),  -- Don't go below 0
            reports_submitted = reports_submitted + 1
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

DELIMITER ;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if triggers were created successfully
SELECT 
    TRIGGER_NAME, 
    EVENT_MANIPULATION, 
    EVENT_OBJECT_TABLE, 
    ACTION_TIMING,
    CREATED
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'traffic_violation_db'
AND TRIGGER_NAME IN ('Auto_Reward_System', 'Auto_Penalty_System')
ORDER BY TRIGGER_NAME;

-- ==========================================
-- TEST QUERIES (Optional - Run to verify)
-- ==========================================

-- Test 1: Check current trust scores
-- SELECT citizen_id, full_name, trust_score, reward_points FROM CITIZENS ORDER BY trust_score DESC LIMIT 10;

-- Test 2: Manually test trigger (UPDATE a pending report to Verified)
-- UPDATE REPORTS SET status = 'Verified', reviewed_at = NOW(), reviewed_by = 'TEST001' 
-- WHERE report_id = 1 AND status = 'Pending';

-- Test 3: Verify trust score increased
-- SELECT citizen_id, full_name, trust_score, reward_points FROM CITIZENS WHERE citizen_id = 1;
