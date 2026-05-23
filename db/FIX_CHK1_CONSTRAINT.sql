-- ============================================================
-- FIX: citizens_chk_1 Check Constraint Violation
-- Problem: Auto_Reward_System trigger adds +10 to trust_score
--          without a cap, violating CHECK (trust_score <= 200)
--          when reporter already has trust_score = 200.
-- Solution: Rebuild all REPORTS triggers with LEAST/GREATEST guards
-- ============================================================

USE traffic_violation;

-- ---------------------------------------------------------------
-- STEP 1: Drop ALL existing triggers on REPORTS that touch CITIZENS
-- ---------------------------------------------------------------
DROP TRIGGER IF EXISTS Auto_Reward_System;
DROP TRIGGER IF EXISTS Auto_Penalty_System;
DROP TRIGGER IF EXISTS trg_report_status_trust;
DROP TRIGGER IF EXISTS after_report_status_change;

SELECT '✅ Step 1 complete: Old triggers dropped' AS status;

-- ---------------------------------------------------------------
-- STEP 2: Recreate REWARD trigger with LEAST cap at 200
-- ---------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER Auto_Reward_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    IF OLD.status = 'Pending' AND NEW.status = 'Verified' THEN
        UPDATE CITIZENS
        SET
            trust_score    = LEAST(trust_score + 10, 200),
            reward_points  = reward_points + 10,
            reports_submitted = reports_submitted + 1
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

-- ---------------------------------------------------------------
-- STEP 3: Recreate PENALTY trigger with GREATEST floor at 0
-- ---------------------------------------------------------------
CREATE TRIGGER Auto_Penalty_System
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    IF OLD.status = 'Pending' AND NEW.status = 'Rejected' THEN
        UPDATE CITIZENS
        SET
            trust_score       = GREATEST(trust_score - 10, 0),
            reports_submitted = reports_submitted + 1
        WHERE citizen_id = NEW.citizen_id;
    END IF;
END$$

DELIMITER ;

SELECT '✅ Step 2-3 complete: Triggers rebuilt with LEAST/GREATEST guards' AS status;

-- ---------------------------------------------------------------
-- STEP 4: Cap any existing citizens who are already over 200
--         (fixes the current violating rows immediately)
-- ---------------------------------------------------------------
UPDATE CITIZENS
SET trust_score = LEAST(trust_score, 200)
WHERE trust_score > 200;

SELECT '✅ Step 4 complete: Existing over-limit trust scores clamped to 200' AS status;

-- ---------------------------------------------------------------
-- STEP 5: Verify triggers are live
-- ---------------------------------------------------------------
SELECT
    TRIGGER_NAME,
    ACTION_STATEMENT
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND TRIGGER_NAME IN ('Auto_Reward_System', 'Auto_Penalty_System')
ORDER BY TRIGGER_NAME;

-- ---------------------------------------------------------------
-- STEP 6: Confirm reporter trust score is within bounds
-- ---------------------------------------------------------------
SELECT citizen_id, full_name, trust_score, reward_points, account_status
FROM CITIZENS
WHERE full_name IN ('Yuvan Vishnu Pandi', 'Pandi Yuvan Vishnu')
ORDER BY citizen_id;

SELECT '✅ ALL DONE — Retry issuing the challan now!' AS final_status;
