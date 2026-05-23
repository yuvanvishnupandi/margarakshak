-- =====================================================
-- TRUST SCORE FIX - Run this in MySQL Workbench
-- =====================================================

USE traffic_violation_db;

-- Step 1: Check if trigger exists
SELECT 'Checking existing trigger...' AS step;
SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust';

-- Step 2: Drop old trigger if it exists
DROP TRIGGER IF EXISTS trg_report_status_trust;

-- Step 3: Create the trust score update trigger
DELIMITER $$

CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only update if status changed
    IF OLD.status <> NEW.status THEN
        
        -- When report is VERIFIED
        IF NEW.status = 'Verified' THEN
            UPDATE CITIZENS
            SET trust_score   = LEAST(trust_score + 10, 200),
                reward_points = reward_points + 5
            WHERE citizen_id  = NEW.citizen_id;
            
            -- Log the update
            SELECT CONCAT('Trust score updated for citizen ', NEW.citizen_id, ': +10 points, +5 rewards') AS message;
            
        -- When report is REJECTED
        ELSEIF NEW.status = 'Rejected' THEN
            UPDATE CITIZENS
            SET trust_score = GREATEST(trust_score - 10, 0)
            WHERE citizen_id = NEW.citizen_id;
            
            -- Log the update
            SELECT CONCAT('Trust score updated for citizen ', NEW.citizen_id, ': -10 points') AS message;
        END IF;
        
    END IF;
END$$

DELIMITER ;

-- Step 4: Verify trigger was created
SELECT 'Trigger created successfully!' AS step;
SHOW TRIGGERS WHERE `Trigger` = 'trg_report_status_trust';

-- Step 5: Test the trigger
SELECT 'Testing trigger with sample update...' AS step;

-- Find a pending report
SET @test_report_id = (SELECT report_id FROM REPORTS WHERE status = 'Pending' LIMIT 1);
SET @test_citizen_id = (SELECT citizen_id FROM REPORTS WHERE report_id = @test_report_id);
SET @before_score = (SELECT trust_score FROM CITIZENS WHERE citizen_id = @test_citizen_id);

SELECT CONCAT('Report ID: ', @test_report_id) AS test_info;
SELECT CONCAT('Citizen ID: ', @test_citizen_id) AS test_info;
SELECT CONCAT('Trust score BEFORE: ', @before_score) AS test_info;

-- Update the report to Verified
UPDATE REPORTS SET status = 'Verified', reviewed_at = NOW() WHERE report_id = @test_report_id;

-- Check trust score after
SET @after_score = (SELECT trust_score FROM CITIZENS WHERE citizen_id = @test_citizen_id);
SELECT CONCAT('Trust score AFTER: ', @after_score) AS test_info;
SELECT CONCAT('Score increased by: ', @after_score - @before_score) AS test_info;

-- Revert the test
UPDATE REPORTS SET status = 'Pending', reviewed_at = NULL WHERE report_id = @test_report_id;

SELECT 'Test complete! Check the results above.' AS step;

-- Step 6: Show all citizens with their trust scores
SELECT 'Current citizen trust scores:' AS step;
SELECT citizen_id, full_name, email, trust_score, reward_points 
FROM CITIZENS 
ORDER BY trust_score DESC;

-- Step 7: Show reports by status
SELECT 'Reports by status:' AS step;
SELECT status, COUNT(*) as count 
FROM REPORTS 
GROUP BY status;

SELECT '✅ TRUST SCORE TRIGGER IS NOW ACTIVE!' AS final_status;
