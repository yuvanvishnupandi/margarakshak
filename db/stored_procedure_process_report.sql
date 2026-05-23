-- ==========================================
-- MARGA RAKSHAK DBMS - STORED PROCEDURE
-- ACID-Compliant Report Processing & Challan Issuance
-- ==========================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS ProcessReportAndIssueChallan(
    IN p_report_id INT,
    IN p_rule_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    -- Declare variables for ACID transaction
    DECLARE v_citizen_id INT;
    DECLARE v_plate_no VARCHAR(20);
    DECLARE v_location_coords VARCHAR(255);
    DECLARE v_base_fine DECIMAL(10,2);
    DECLARE v_event_id INT;
    DECLARE v_challan_id INT;
    DECLARE v_current_status VARCHAR(20);
    
    -- Error handler for rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Start ACID-compliant transaction
    START TRANSACTION;
    
    -- Step 1: Validate report exists and is Pending
    SELECT status, citizen_id, plate_no, location_coords 
    INTO v_current_status, v_citizen_id, v_plate_no, v_location_coords
    FROM REPORTS 
    WHERE report_id = p_report_id
    FOR UPDATE;  -- Row-level lock for concurrency safety
    
    IF v_current_status IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Report not found';
    END IF;
    
    IF v_current_status != 'Pending' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = CONCAT('Report already processed with status: ', v_current_status);
    END IF;
    
    -- Step 2: Update REPORTS status (Triggers will handle trust score)
    UPDATE REPORTS 
    SET status = p_status, 
        reviewed_at = UTC_TIMESTAMP()
    WHERE report_id = p_report_id;
    
    -- Step 3: If Verified, create VIOLATION_EVENT and CHALLAN
    IF p_status = 'Verified' THEN
        -- Validate rule_id exists and is active
        SELECT base_fine_amount 
        INTO v_base_fine
        FROM VIOLATION_RULES 
        WHERE rule_id = p_rule_id AND is_active = 1;
        
        IF v_base_fine IS NULL THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = CONCAT('Violation rule ', p_rule_id, ' not found or inactive');
        END IF;
        
        -- Insert VIOLATION_EVENT
        INSERT INTO VIOLATION_EVENTS 
            (report_id, rule_id, plate_no, event_timestamp, location_coords)
        VALUES 
            (p_report_id, p_rule_id, v_plate_no, UTC_TIMESTAMP(), v_location_coords);
        
        SET v_event_id = LAST_INSERT_ID();
        
        -- Insert CHALLAN (hardcoded badge_no 'POL-101' for FK constraint safety)
        INSERT INTO CHALLANS 
            (event_id, citizen_id, badge_no, total_amount, payment_status, issue_date, due_date)
        VALUES 
            (v_event_id, v_citizen_id, 'POL-101', v_base_fine, 'Unpaid', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY));
        
        SET v_challan_id = LAST_INSERT_ID();
    END IF;
    
    -- Commit transaction
    COMMIT;
    
    -- Return success result
    SELECT 
        'success' AS result,
        p_report_id AS report_id,
        p_status AS status,
        v_event_id AS event_id,
        v_challan_id AS challan_id,
        v_base_fine AS fine_amount;
    
END$$

DELIMITER ;

-- ==========================================
-- VERIFICATION QUERY
-- ==========================================

-- Check if stored procedure was created
SELECT 
    ROUTINE_NAME, 
    ROUTINE_TYPE, 
    CREATED, 
    LAST_ALTERED
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'traffic_violation_db'
AND ROUTINE_NAME = 'ProcessReportAndIssueChallan';
