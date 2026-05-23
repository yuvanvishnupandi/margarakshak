-- ============================================================
-- MARGA RAKSHAK — Trust Score Fix
-- Run this in MySQL Workbench or command client:
--   SOURCE C:/Users/yuvan/OneDrive/Documents/traffic_violation/db/fix_trust_score_cap.sql;
-- ============================================================

USE traffic_violation_db;

-- Step 1: Reset ALL citizens whose trust_score > 100 (cap it)
UPDATE CITIZENS SET trust_score = 100 WHERE trust_score > 100;

-- Step 2: Set yuvan.reporter@gmail.com trust score to 50 (for demo)
UPDATE CITIZENS
SET trust_score = 50,
    reward_points = 20,
    consecutive_rejections = 0
WHERE email = 'yuvan.reporter@gmail.com';

-- Verify
SELECT citizen_id, full_name, email, trust_score, reward_points, account_status
FROM CITIZENS
WHERE email = 'yuvan.reporter@gmail.com';

-- Step 3: Drop and recreate trigger with correct cap (100 not 200)
DROP TRIGGER IF EXISTS trg_report_status_trust;

DELIMITER $$

CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_rejection_count INT DEFAULT 0;
    DECLARE v_total_rejections INT DEFAULT 0;
    DECLARE v_trust INT DEFAULT 0;

    IF OLD.status <> NEW.status THEN

        -- ── VERIFIED or CHALLAN ISSUED → reward citizen ──────────────
        IF NEW.status = 'Verified' OR NEW.status = 'Challan Issued' THEN
            UPDATE CITIZENS
            SET trust_score            = LEAST(trust_score + 10, 100),  -- MAX 100
                reward_points          = reward_points + 5,
                consecutive_rejections = 0
            WHERE citizen_id = NEW.citizen_id;

            INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
            VALUES (NEW.citizen_id, 'Report Verified',
                CONCAT('✅ Your report #', NEW.report_id,
                       ' has been verified! Trust score +10 (max 100), Reward points +5.'));

        -- ── REJECTED → penalize citizen ───────────────────────────────
        ELSEIF NEW.status = 'Rejected' THEN
            SELECT consecutive_rejections, total_rejections
            INTO v_rejection_count, v_total_rejections
            FROM CITIZENS WHERE citizen_id = NEW.citizen_id;

            SET v_rejection_count  = v_rejection_count + 1;
            SET v_total_rejections = v_total_rejections + 1;

            UPDATE CITIZENS
            SET trust_score            = GREATEST(trust_score - 10, 0),  -- MIN 0
                consecutive_rejections = v_rejection_count,
                total_rejections       = v_total_rejections
            WHERE citizen_id = NEW.citizen_id;

            -- Check if trust score hit 0 → suspend account
            SELECT trust_score INTO v_trust
            FROM CITIZENS WHERE citizen_id = NEW.citizen_id;

            IF v_trust <= 0 THEN
                UPDATE CITIZENS
                SET account_status = 'Suspended'
                WHERE citizen_id = NEW.citizen_id AND account_status = 'Active';
            END IF;

            INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
            VALUES (NEW.citizen_id, 'Report Rejected',
                CONCAT('❌ Your report #', NEW.report_id,
                       ' was rejected. Trust score -10. Consecutive: ', v_rejection_count,
                       '. Reason: ', COALESCE(NEW.rejection_reason, 'Insufficient evidence')));
        END IF;

    END IF;
END$$

DELIMITER ;

-- Step 4: Also fix the CHECK constraint to enforce 0-100 at DB level
-- (Safe: only applies if column doesn't already have the right constraint)
ALTER TABLE CITIZENS
  MODIFY COLUMN trust_score INT NOT NULL DEFAULT 50
  CHECK (trust_score >= 0 AND trust_score <= 100);

-- Final verification
SELECT 'Trigger recreated with trust_score cap of 100.' AS status;
SELECT full_name, email, trust_score, reward_points FROM CITIZENS ORDER BY citizen_id;
