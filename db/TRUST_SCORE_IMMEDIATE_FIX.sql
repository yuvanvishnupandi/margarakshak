-- =====================================================
-- DIRECT TRUST SCORE FIX - COPY AND PASTE THIS ENTIRE SCRIPT
-- Run in MySQL Workbench connected to traffic_violation_db
-- =====================================================

USE traffic_violation_db;

-- STEP 1: Drop any existing broken triggers
DROP TRIGGER IF EXISTS after_report_status_change;
DROP TRIGGER IF EXISTS trg_report_status_trust;

SELECT '✅ Old triggers dropped' AS step1;

-- STEP 2: Create the correct trigger
DELIMITER $$

CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only update if status actually changed
    IF OLD.status <> NEW.status THEN
        
        -- When report is VERIFIED - give +10 trust, +5 rewards
        IF NEW.status = 'Verified' THEN
            UPDATE CITIZENS
            SET trust_score   = LEAST(trust_score + 10, 200),
                reward_points = reward_points + 5
            WHERE citizen_id  = NEW.citizen_id;
            
        -- When report is REJECTED - take -10 trust
        ELSEIF NEW.status = 'Rejected' THEN
            UPDATE CITIZENS
            SET trust_score = GREATEST(trust_score - 10, 0)
            WHERE citizen_id = NEW.citizen_id;
        END IF;
        
    END IF;
END$$

DELIMITER ;

SELECT '✅ Trigger created successfully' AS step2;

-- STEP 3: Verify trigger exists
SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust';

-- STEP 4: Show current trust scores
SELECT 'Current trust scores:' AS info;
SELECT citizen_id, full_name, email, trust_score, reward_points 
FROM CITIZENS 
ORDER BY citizen_id;

-- STEP 5: Find your citizen ID from reports
SELECT 'Your citizen ID from reports:' AS info;
SELECT DISTINCT citizen_id 
FROM REPORTS 
WHERE citizen_id IN (
    SELECT citizen_id FROM CITIZENS WHERE full_name = 'Yuvan Vishnu Pandi'
);

-- STEP 6: Show your current trust score
SELECT 'Your current trust score:' AS info;
SELECT citizen_id, full_name, trust_score, reward_points 
FROM CITIZENS 
WHERE full_name = 'Yuvan Vishnu Pandi';

-- STEP 7: Calculate what your trust score SHOULD be
SELECT 'Calculation of expected trust score:' AS info;
SELECT 
    c.citizen_id,
    c.full_name,
    c.trust_score AS current_score,
    (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = c.citizen_id AND status = 'Verified') AS verified_count,
    (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = c.citizen_id AND status = 'Rejected') AS rejected_count,
    50 + (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = c.citizen_id AND status = 'Verified') * 10 
       - (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = c.citizen_id AND status = 'Rejected') * 10 AS expected_score
FROM CITIZENS c
WHERE c.full_name = 'Yuvan Vishnu Pandi';

-- STEP 8: Manually fix your trust score RIGHT NOW
-- This calculates: 50 + (verified × 10) - (rejected × 10)
UPDATE CITIZENS 
SET trust_score = GREATEST(
    LEAST(
        50 + (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = CITIZENS.citizen_id AND status = 'Verified') * 10 
             - (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = CITIZENS.citizen_id AND status = 'Rejected') * 10,
        200
    ),
    0
),
reward_points = (SELECT COUNT(*) FROM REPORTS WHERE citizen_id = CITIZENS.citizen_id AND status = 'Verified') * 5
WHERE full_name = 'Yuvan Vishnu Pandi';

SELECT 'Trust score updated!' AS step8;

-- STEP 9: Show the updated trust score
SELECT 'Your NEW trust score:' AS info;
SELECT citizen_id, full_name, trust_score, reward_points 
FROM CITIZENS 
WHERE full_name = 'Yuvan Vishnu Pandi';

SELECT '✅ ALL DONE! Refresh your dashboard now!' AS final_message;
