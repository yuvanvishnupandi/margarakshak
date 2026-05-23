-- ============================================================================
-- HABITUAL OFFENDER PENALTY TRIGGER
-- ============================================================================
-- Automatically applies 2x fine multiplier when vehicle has 3+ challans
-- in the last 30 days. Fires BEFORE INSERT on CHALLANS table.
-- ============================================================================

USE traffic_violation_db;

-- Drop trigger if exists (for re-runnable migration)
DROP TRIGGER IF EXISTS trg_habitual_offender_penalty;

DELIMITER $$

CREATE TRIGGER trg_habitual_offender_penalty
BEFORE INSERT ON CHALLANS
FOR EACH ROW
BEGIN
    DECLARE v_recent_challans INT DEFAULT 0;
    DECLARE v_plate_no VARCHAR(20);
    
    -- Get plate number from the associated violation event
    SELECT plate_no INTO v_plate_no 
    FROM VIOLATION_EVENTS 
    WHERE event_id = NEW.event_id;
    
    -- Count recent challans for this vehicle in last 30 days
    -- Includes all statuses except 'Waived' and 'Disputed'
    IF v_plate_no IS NOT NULL AND v_plate_no <> '' THEN
        SELECT COUNT(*) INTO v_recent_challans
        FROM CHALLANS c
        JOIN VIOLATION_EVENTS ve ON c.event_id = ve.event_id
        WHERE ve.plate_no = v_plate_no
          AND c.issue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND c.payment_status IN ('Unpaid', 'Paid', 'Overdue');
        
        -- Apply 2x penalty if habitual offender (3+ recent challans)
        IF v_recent_challans >= 3 THEN
            SET NEW.total_amount = NEW.total_amount * 2;
        END IF;
    END IF;
END$$

DELIMITER ;

-- 3. Verify trigger creation
SELECT 'Habitual Offender Penalty Trigger Created' AS status;
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE 
FROM INFORMATION_SCHEMA.TRIGGERS 
WHERE TRIGGER_SCHEMA = 'traffic_violation_db' 
  AND TRIGGER_NAME = 'trg_habitual_offender_penalty';
