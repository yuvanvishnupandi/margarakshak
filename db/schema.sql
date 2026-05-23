-- ============================================================================
-- TRAFFIC VIOLATION MANAGEMENT SYSTEM — PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Government/Law Enforcement Tier-1 DBMS
-- 5NF Normalized · Temporal Versioning · Transient Tables · PL/SQL
-- ============================================================================

SET GLOBAL event_scheduler = ON;

DROP DATABASE IF EXISTS traffic_violation_db;
CREATE DATABASE traffic_violation_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE traffic_violation_db;

-- ============================================================================
-- 1. CORE ENTITY TABLES (5NF Normalized)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1A. CITIZENS — Primary civilian user accounts
--     Includes biometric face encoding (BLOB) and trust score.
--     Temporal columns (valid_from / valid_to) track historical state.
-- --------------------------------------------------------------------------
CREATE TABLE CITIZENS (
    citizen_id      INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    phone_no        VARCHAR(20)     DEFAULT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    face_encoding   BLOB            DEFAULT NULL   COMMENT 'Serialized 128-d face encoding vector from face_recognition lib',
    trust_score     INT             NOT NULL DEFAULT 50  CHECK (trust_score >= 0 AND trust_score <= 200),
    reward_points   INT             NOT NULL DEFAULT 0,
    account_status  ENUM('Active','Suspended','Banned') NOT NULL DEFAULT 'Active',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    valid_from      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        DATETIME        NOT NULL DEFAULT '9999-12-31 23:59:59',
    INDEX idx_citizen_email       (email),
    INDEX idx_citizen_status      (account_status),
    INDEX idx_citizen_trust       (trust_score)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1B. CITIZENS_HISTORY — Temporal audit trail for citizen records
--     Every trust_score change or profile mutation is captured here.
-- --------------------------------------------------------------------------
CREATE TABLE CITIZENS_HISTORY (
    history_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    full_name       VARCHAR(120)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone_no        VARCHAR(20)     DEFAULT NULL,
    trust_score     INT             NOT NULL,
    reward_points   INT             NOT NULL,
    account_status  ENUM('Active','Suspended','Banned') NOT NULL,
    valid_from      DATETIME        NOT NULL,
    valid_to        DATETIME        NOT NULL,
    operation_type  ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    changed_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by      VARCHAR(100)    DEFAULT 'SYSTEM',
    INDEX idx_ch_citizen (citizen_id),
    INDEX idx_ch_period  (valid_from, valid_to)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1C. POLICE_OFFICERS — Law enforcement personnel
-- --------------------------------------------------------------------------
CREATE TABLE POLICE_OFFICERS (
    badge_no        VARCHAR(20)     PRIMARY KEY,
    full_name       VARCHAR(120)    NOT NULL,
    officer_rank    VARCHAR(50)     NOT NULL DEFAULT 'Constable',
    station_code    VARCHAR(30)     NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    phone_no        VARCHAR(20)     DEFAULT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_police_station (station_code)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1D. VEHICLES — Vehicle registry linked to violation events
-- --------------------------------------------------------------------------
CREATE TABLE VEHICLES (
    plate_no        VARCHAR(20)     PRIMARY KEY,
    vehicle_model   VARCHAR(100)    DEFAULT NULL,
    vehicle_type    ENUM('Car','Motorcycle','Truck','Bus','Auto-Rickshaw','Bicycle','Other') NOT NULL DEFAULT 'Car',
    owner_name      VARCHAR(120)    DEFAULT NULL,
    owner_type      ENUM('Individual','Corporate','Government') NOT NULL DEFAULT 'Individual',
    registered_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle_type (vehicle_type)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1E. VIOLATION_RULES — Master table of traffic violation categories
-- --------------------------------------------------------------------------
CREATE TABLE VIOLATION_RULES (
    rule_id         INT AUTO_INCREMENT PRIMARY KEY,
    rule_code       VARCHAR(20)     NOT NULL UNIQUE,
    rule_name       VARCHAR(150)    NOT NULL,
    description     TEXT            DEFAULT NULL,
    base_fine_amount DECIMAL(10,2)  NOT NULL CHECK (base_fine_amount > 0),
    severity        ENUM('Minor','Moderate','Major','Critical') NOT NULL DEFAULT 'Moderate',
    violation_time  ENUM('Daytime','Nighttime','Anytime') NOT NULL DEFAULT 'Anytime',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rule_severity (severity)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1F. REPORTS — Violation reports filed by citizens
-- --------------------------------------------------------------------------
CREATE TABLE REPORTS (
    report_id       INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    plate_no        VARCHAR(20)     DEFAULT NULL,
    location_coords VARCHAR(60)     DEFAULT NULL   COMMENT 'GPS lat,lng string',
    location_address VARCHAR(300)   DEFAULT NULL,
    description     TEXT            NOT NULL,
    date_reported   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
    reviewed_by     VARCHAR(20)     DEFAULT NULL   COMMENT 'Badge number of reviewing officer',
    reviewed_at     DATETIME        DEFAULT NULL,
    rejection_reason TEXT           DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_citizen  FOREIGN KEY (citizen_id)   REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_plate    FOREIGN KEY (plate_no)     REFERENCES VEHICLES(plate_no)   ON DELETE SET NULL,
    CONSTRAINT fk_report_officer  FOREIGN KEY (reviewed_by)  REFERENCES POLICE_OFFICERS(badge_no) ON DELETE SET NULL,
    INDEX idx_report_status   (status),
    INDEX idx_report_citizen  (citizen_id),
    INDEX idx_report_date     (date_reported)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1G. EVIDENCE_PHOTOS — Photographic evidence attached to reports
-- --------------------------------------------------------------------------
CREATE TABLE EVIDENCE_PHOTOS (
    photo_id        INT AUTO_INCREMENT PRIMARY KEY,
    report_id       INT             NOT NULL,
    image_url       VARCHAR(500)    NOT NULL,
    caption         VARCHAR(255)    DEFAULT NULL,
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_report FOREIGN KEY (report_id) REFERENCES REPORTS(report_id) ON DELETE CASCADE,
    INDEX idx_evidence_report (report_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1H. VIOLATION_EVENTS — Junction: links a report to specific violation rules
-- --------------------------------------------------------------------------
CREATE TABLE VIOLATION_EVENTS (
    event_id        INT AUTO_INCREMENT PRIMARY KEY,
    report_id       INT             NOT NULL,
    rule_id         INT             NOT NULL,
    plate_no        VARCHAR(20)     DEFAULT NULL,
    event_timestamp DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location_coords VARCHAR(60)     DEFAULT NULL,
    notes           TEXT            DEFAULT NULL,
    CONSTRAINT fk_event_report   FOREIGN KEY (report_id) REFERENCES REPORTS(report_id)        ON DELETE CASCADE,
    CONSTRAINT fk_event_rule     FOREIGN KEY (rule_id)   REFERENCES VIOLATION_RULES(rule_id)   ON DELETE RESTRICT,
    CONSTRAINT fk_event_vehicle  FOREIGN KEY (plate_no)  REFERENCES VEHICLES(plate_no)         ON DELETE SET NULL,
    INDEX idx_event_report (report_id),
    INDEX idx_event_rule   (rule_id)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1I. CHALLANS — Traffic fines / penalties issued
--     Temporal columns (valid_from / valid_to) track fine adjustments.
-- --------------------------------------------------------------------------
CREATE TABLE CHALLANS (
    challan_id      INT AUTO_INCREMENT PRIMARY KEY,
    event_id        INT             NOT NULL,
    citizen_id      INT             NOT NULL,
    badge_no        VARCHAR(20)     NOT NULL,
    total_amount    DECIMAL(10,2)   NOT NULL CHECK (total_amount > 0),
    payment_status  ENUM('Unpaid','Paid','Overdue','Waived','Disputed') NOT NULL DEFAULT 'Unpaid',
    issue_date      DATE            NOT NULL,
    due_date        DATE            NOT NULL,
    paid_at         DATETIME        DEFAULT NULL,
    transaction_ref VARCHAR(100)    DEFAULT NULL,
    valid_from      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to        DATETIME        NOT NULL DEFAULT '9999-12-31 23:59:59',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_challan_event   FOREIGN KEY (event_id)   REFERENCES VIOLATION_EVENTS(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_challan_citizen FOREIGN KEY (citizen_id)  REFERENCES CITIZENS(citizen_id)       ON DELETE CASCADE,
    CONSTRAINT fk_challan_officer FOREIGN KEY (badge_no)    REFERENCES POLICE_OFFICERS(badge_no)  ON DELETE RESTRICT,
    INDEX idx_challan_status  (payment_status),
    INDEX idx_challan_citizen (citizen_id),
    INDEX idx_challan_due     (due_date),
    INDEX idx_challan_issued  (issue_date)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1J. CHALLANS_HISTORY — Temporal audit trail for challan adjustments
-- --------------------------------------------------------------------------
CREATE TABLE CHALLANS_HISTORY (
    history_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    challan_id      INT             NOT NULL,
    event_id        INT             NOT NULL,
    citizen_id      INT             NOT NULL,
    badge_no        VARCHAR(20)     NOT NULL,
    total_amount    DECIMAL(10,2)   NOT NULL,
    payment_status  ENUM('Unpaid','Paid','Overdue','Waived','Disputed') NOT NULL,
    issue_date      DATE            NOT NULL,
    due_date        DATE            NOT NULL,
    paid_at         DATETIME        DEFAULT NULL,
    transaction_ref VARCHAR(100)    DEFAULT NULL,
    valid_from      DATETIME        NOT NULL,
    valid_to        DATETIME        NOT NULL,
    operation_type  ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    changed_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by      VARCHAR(100)    DEFAULT 'SYSTEM',
    INDEX idx_chh_challan (challan_id),
    INDEX idx_chh_period  (valid_from, valid_to)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 1K. OVERDUE_LOG — Ledger for flagged overdue challans
-- --------------------------------------------------------------------------
CREATE TABLE OVERDUE_LOG (
    log_id          INT AUTO_INCREMENT PRIMARY KEY,
    challan_id      INT             NOT NULL,
    citizen_id      INT             NOT NULL,
    flagged_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    original_amount DECIMAL(10,2)   NOT NULL,
    penalty_amount  DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    notes           TEXT            DEFAULT NULL,
    CONSTRAINT fk_overdue_challan FOREIGN KEY (challan_id) REFERENCES CHALLANS(challan_id) ON DELETE CASCADE,
    CONSTRAINT fk_overdue_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_overdue_challan (challan_id)
) ENGINE=InnoDB;


-- ============================================================================
-- 2. TRANSIENT / TEMPORARY TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2A. ACTIVE_SESSIONS — Short-lived login sessions (auto-purge eligible)
-- --------------------------------------------------------------------------
CREATE TABLE ACTIVE_SESSIONS (
    session_id      VARCHAR(128)    PRIMARY KEY,
    user_id         VARCHAR(50)     NOT NULL   COMMENT 'citizen_id or badge_no',
    user_role       ENUM('Citizen','Police')   NOT NULL,
    ip_address      VARCHAR(45)     DEFAULT NULL,
    user_agent      VARCHAR(500)    DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME        NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    INDEX idx_session_user    (user_id),
    INDEX idx_session_expires (expires_at)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 2B. UNVERIFIED_UPLOADS — Staging area for evidence before report link
-- --------------------------------------------------------------------------
CREATE TABLE UNVERIFIED_UPLOADS (
    upload_id       INT AUTO_INCREMENT PRIMARY KEY,
    uploader_id     INT             NOT NULL,
    file_path       VARCHAR(500)    NOT NULL,
    file_hash       VARCHAR(64)     DEFAULT NULL   COMMENT 'SHA-256 for dedup',
    mime_type       VARCHAR(100)    DEFAULT NULL,
    file_size_bytes BIGINT          DEFAULT NULL,
    uploaded_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME        NOT NULL,
    is_linked       BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_upload_citizen FOREIGN KEY (uploader_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_upload_expires  (expires_at),
    INDEX idx_upload_linked   (is_linked)
) ENGINE=InnoDB;

-- --------------------------------------------------------------------------
-- 2C. EVENT: Auto-purge expired sessions every hour
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_purge_expired_sessions
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM ACTIVE_SESSIONS WHERE expires_at < NOW();
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 2D. EVENT: Auto-purge unlinked uploads older than 24 hours
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_purge_unverified_uploads
ON SCHEDULE EVERY 6 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    DELETE FROM UNVERIFIED_UPLOADS WHERE expires_at < NOW() AND is_linked = FALSE;
END$$
DELIMITER ;


-- ============================================================================
-- 3. TRIGGERS — Automatic trust score & temporal versioning
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3A. BEFORE UPDATE on CITIZENS — Capture old row into CITIZENS_HISTORY
--     and auto-suspend if trust drops to 0.
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_citizens_before_update
BEFORE UPDATE ON CITIZENS
FOR EACH ROW
BEGIN
    -- Close out the old temporal row in history
    INSERT INTO CITIZENS_HISTORY (
        citizen_id, full_name, email, phone_no,
        trust_score, reward_points, account_status,
        valid_from, valid_to, operation_type, changed_by
    ) VALUES (
        OLD.citizen_id, OLD.full_name, OLD.email, OLD.phone_no,
        OLD.trust_score, OLD.reward_points, OLD.account_status,
        OLD.valid_from, NOW(), 'UPDATE', 'SYSTEM'
    );

    -- Advance the valid_from on the new row
    SET NEW.valid_from = NOW();
    SET NEW.valid_to   = '9999-12-31 23:59:59';

    -- Auto-suspend if trust score hits zero
    IF NEW.trust_score <= 0 AND OLD.account_status = 'Active' THEN
        SET NEW.account_status = 'Suspended';
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 3B. AFTER INSERT on CITIZENS — Log initial row in history
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_citizens_after_insert
AFTER INSERT ON CITIZENS
FOR EACH ROW
BEGIN
    INSERT INTO CITIZENS_HISTORY (
        citizen_id, full_name, email, phone_no,
        trust_score, reward_points, account_status,
        valid_from, valid_to, operation_type, changed_by
    ) VALUES (
        NEW.citizen_id, NEW.full_name, NEW.email, NEW.phone_no,
        NEW.trust_score, NEW.reward_points, NEW.account_status,
        NEW.valid_from, NEW.valid_to, 'INSERT', 'SYSTEM'
    );
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 3C. AFTER UPDATE on REPORTS — Trust score adjustment
--     Verified → reporter gains +10 trust, +5 reward
--     Rejected → reporter loses -10 trust
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        IF NEW.status = 'Verified' THEN
            UPDATE CITIZENS
            SET trust_score   = LEAST(trust_score + 10, 200),
                reward_points = reward_points + 5
            WHERE citizen_id  = NEW.citizen_id;

        ELSEIF NEW.status = 'Rejected' THEN
            UPDATE CITIZENS
            SET trust_score  = GREATEST(trust_score - 10, 0)
            WHERE citizen_id = NEW.citizen_id;
        END IF;
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 3D. BEFORE UPDATE on CHALLANS — Capture into CHALLANS_HISTORY
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_challans_before_update
BEFORE UPDATE ON CHALLANS
FOR EACH ROW
BEGIN
    INSERT INTO CHALLANS_HISTORY (
        challan_id, event_id, citizen_id, badge_no,
        total_amount, payment_status, issue_date, due_date,
        paid_at, transaction_ref,
        valid_from, valid_to, operation_type, changed_by
    ) VALUES (
        OLD.challan_id, OLD.event_id, OLD.citizen_id, OLD.badge_no,
        OLD.total_amount, OLD.payment_status, OLD.issue_date, OLD.due_date,
        OLD.paid_at, OLD.transaction_ref,
        OLD.valid_from, NOW(), 'UPDATE', 'SYSTEM'
    );

    SET NEW.valid_from = NOW();
    SET NEW.valid_to   = '9999-12-31 23:59:59';
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 3E. AFTER INSERT on CHALLANS — Log initial challan in history
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_challans_after_insert
AFTER INSERT ON CHALLANS
FOR EACH ROW
BEGIN
    INSERT INTO CHALLANS_HISTORY (
        challan_id, event_id, citizen_id, badge_no,
        total_amount, payment_status, issue_date, due_date,
        paid_at, transaction_ref,
        valid_from, valid_to, operation_type, changed_by
    ) VALUES (
        NEW.challan_id, NEW.event_id, NEW.citizen_id, NEW.badge_no,
        NEW.total_amount, NEW.payment_status, NEW.issue_date, NEW.due_date,
        NEW.paid_at, NEW.transaction_ref,
        NEW.valid_from, NEW.valid_to, 'INSERT', 'SYSTEM'
    );
END$$
DELIMITER ;


-- ============================================================================
-- 4. STORED PROCEDURES & EXCEPTION HANDLING
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4A. sp_issue_challan — Safe challan generation with full transaction
--     Uses DECLARE EXIT HANDLER FOR SQLEXCEPTION + ROLLBACK.
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_issue_challan(
    IN p_report_id      INT,
    IN p_rule_id        INT,
    IN p_badge_no       VARCHAR(20),
    IN p_plate_no       VARCHAR(20),
    OUT p_challan_id    INT,
    OUT p_result_code   INT,
    OUT p_result_msg    VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_citizen_id    INT;
    DECLARE v_event_id      INT;
    DECLARE v_fine_amount   DECIMAL(10,2);
    DECLARE v_rule_name     VARCHAR(150);
    DECLARE v_location      VARCHAR(60);
    DECLARE v_report_status VARCHAR(20);
    DECLARE v_existing      INT DEFAULT 0;

    -- Exception handler: rollback on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_msg  = 'SQLEXCEPTION: Transaction rolled back. Challan generation failed.';
    END;

    -- Initialise outputs
    SET p_challan_id  = 0;
    SET p_result_code = 0;
    SET p_result_msg  = '';

    START TRANSACTION;

    -- 1. Validate the report exists and is Pending (row-level lock)
    SELECT citizen_id, status, location_coords
    INTO v_citizen_id, v_report_status, v_location
    FROM REPORTS
    WHERE report_id = p_report_id
    FOR UPDATE;

    IF v_citizen_id IS NULL THEN
        SET p_result_code = -2;
        SET p_result_msg  = 'Report not found.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    IF v_report_status <> 'Pending' THEN
        SET p_result_code = -3;
        SET p_result_msg  = CONCAT('Report is already ', v_report_status, '. Cannot issue challan.');
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    -- 2. Fetch the violation rule fine
    SELECT base_fine_amount, rule_name
    INTO v_fine_amount, v_rule_name
    FROM VIOLATION_RULES
    WHERE rule_id = p_rule_id AND is_active = TRUE;

    IF v_fine_amount IS NULL THEN
        SET p_result_code = -4;
        SET p_result_msg  = 'Invalid or inactive violation rule.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    -- 3. Ensure vehicle record exists (auto-create if missing)
    IF p_plate_no IS NOT NULL AND p_plate_no <> '' THEN
        SELECT COUNT(*) INTO v_existing FROM VEHICLES WHERE plate_no = p_plate_no;
        IF v_existing = 0 THEN
            INSERT INTO VEHICLES (plate_no, vehicle_type) VALUES (p_plate_no, 'Car');
        END IF;
    END IF;

    -- 4. Update the report status to Verified (this fires trg_report_status_trust)
    UPDATE REPORTS
    SET status      = 'Verified',
        reviewed_by = p_badge_no,
        reviewed_at = NOW()
    WHERE report_id = p_report_id;

    -- 5. Create the violation event
    INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, location_coords, notes)
    VALUES (p_report_id, p_rule_id, p_plate_no, v_location, CONCAT('Violation: ', v_rule_name));

    SET v_event_id = LAST_INSERT_ID();

    -- 6. Create the challan
    INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, issue_date, due_date)
    VALUES (
        v_event_id,
        v_citizen_id,
        p_badge_no,
        v_fine_amount,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    );

    SET p_challan_id  = LAST_INSERT_ID();
    SET p_result_code = 1;
    SET p_result_msg  = CONCAT('Challan #', p_challan_id, ' issued successfully for Rs.', v_fine_amount, '.');

    COMMIT;
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 4B. sp_pay_challan — Payment with row-level locking
--     Prevents double-payment race conditions.
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_pay_challan(
    IN p_challan_id     INT,
    IN p_citizen_id     INT,
    IN p_txn_ref        VARCHAR(100),
    OUT p_result_code   INT,
    OUT p_result_msg    VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_status      VARCHAR(20);
    DECLARE v_amount      DECIMAL(10,2);
    DECLARE v_owner_id    INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_msg  = 'SQLEXCEPTION: Payment transaction rolled back.';
    END;

    SET p_result_code = 0;
    SET p_result_msg  = '';

    START TRANSACTION;

    -- Row-level lock: SELECT ... FOR UPDATE on the specific challan
    SELECT payment_status, total_amount, citizen_id
    INTO v_status, v_amount, v_owner_id
    FROM CHALLANS
    WHERE challan_id = p_challan_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_result_code = -2;
        SET p_result_msg  = 'Challan not found.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    IF v_owner_id <> p_citizen_id THEN
        SET p_result_code = -3;
        SET p_result_msg  = 'Unauthorized: challan does not belong to this citizen.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    IF v_status = 'Paid' THEN
        SET p_result_code = -4;
        SET p_result_msg  = 'Challan has already been paid.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    IF v_status = 'Waived' THEN
        SET p_result_code = -5;
        SET p_result_msg  = 'Challan has been waived. No payment required.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    -- Process payment
    UPDATE CHALLANS
    SET payment_status  = 'Paid',
        paid_at         = NOW(),
        transaction_ref = p_txn_ref
    WHERE challan_id    = p_challan_id;

    -- Reward citizen for timely payment
    UPDATE CITIZENS
    SET reward_points = reward_points + 2
    WHERE citizen_id  = p_citizen_id;

    SET p_result_code = 1;
    SET p_result_msg  = CONCAT('Payment of Rs.', v_amount, ' processed successfully. Ref: ', p_txn_ref);

    COMMIT;
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 4C. sp_reject_report — Reject a report with reason
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_reject_report(
    IN p_report_id      INT,
    IN p_badge_no       VARCHAR(20),
    IN p_reason         TEXT,
    OUT p_result_code   INT,
    OUT p_result_msg    VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_result_msg  = 'SQLEXCEPTION: Rejection rolled back.';
    END;

    SET p_result_code = 0;
    SET p_result_msg  = '';

    START TRANSACTION;

    SELECT status INTO v_status
    FROM REPORTS WHERE report_id = p_report_id FOR UPDATE;

    IF v_status IS NULL THEN
        SET p_result_code = -2;
        SET p_result_msg  = 'Report not found.';
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    IF v_status <> 'Pending' THEN
        SET p_result_code = -3;
        SET p_result_msg  = CONCAT('Report is already ', v_status, '.');
        ROLLBACK;
        LEAVE proc_body;
    END IF;

    UPDATE REPORTS
    SET status           = 'Rejected',
        reviewed_by      = p_badge_no,
        reviewed_at      = NOW(),
        rejection_reason = p_reason
    WHERE report_id      = p_report_id;

    SET p_result_code = 1;
    SET p_result_msg  = 'Report rejected successfully.';

    COMMIT;
END$$
DELIMITER ;

-- --------------------------------------------------------------------------
-- 4D. sp_flag_overdue_challans — Cursor-based procedure to flag overdue
--     Iterates unpaid challans past due date, applies 15% late penalty,
--     logs in OVERDUE_LOG, and penalises citizen trust score.
-- --------------------------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE sp_flag_overdue_challans(
    OUT p_flagged_count INT
)
BEGIN
    DECLARE v_done          INT DEFAULT 0;
    DECLARE v_challan_id    INT;
    DECLARE v_citizen_id    INT;
    DECLARE v_amount        DECIMAL(10,2);
    DECLARE v_penalty       DECIMAL(10,2);
    DECLARE v_already       INT DEFAULT 0;

    -- Cursor: select all unpaid challans past due date
    DECLARE cur_overdue CURSOR FOR
        SELECT challan_id, citizen_id, total_amount
        FROM CHALLANS
        WHERE payment_status = 'Unpaid'
          AND due_date < CURDATE();

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    SET p_flagged_count = 0;

    OPEN cur_overdue;

    read_loop: LOOP
        FETCH cur_overdue INTO v_challan_id, v_citizen_id, v_amount;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Check if already flagged
        SELECT COUNT(*) INTO v_already
        FROM OVERDUE_LOG WHERE challan_id = v_challan_id;

        IF v_already = 0 THEN
            -- Calculate 15% late penalty
            SET v_penalty = ROUND(v_amount * 0.15, 2);

            -- Update challan status to Overdue and add penalty
            UPDATE CHALLANS
            SET payment_status = 'Overdue',
                total_amount   = total_amount + v_penalty
            WHERE challan_id   = v_challan_id;

            -- Log in overdue ledger
            INSERT INTO OVERDUE_LOG (challan_id, citizen_id, original_amount, penalty_amount, notes)
            VALUES (v_challan_id, v_citizen_id, v_amount, v_penalty,
                    CONCAT('Late penalty 15% = Rs.', v_penalty, ' applied on ', CURDATE()));

            -- Penalise citizen trust score
            UPDATE CITIZENS
            SET trust_score = GREATEST(trust_score - 5, 0)
            WHERE citizen_id = v_citizen_id;

            SET p_flagged_count = p_flagged_count + 1;
        END IF;
    END LOOP;

    CLOSE cur_overdue;
END$$
DELIMITER ;


-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5A. Pending_Reports_Dashboard — Police command center primary feed
-- --------------------------------------------------------------------------
CREATE VIEW Pending_Reports_Dashboard AS
SELECT
    r.report_id,
    r.date_reported,
    r.description,
    r.location_coords,
    r.location_address,
    r.plate_no,
    c.citizen_id,
    c.full_name        AS reporter_name,
    c.trust_score      AS reporter_trust_score,
    c.phone_no         AS reporter_phone,
    (SELECT COUNT(*) FROM EVIDENCE_PHOTOS ep WHERE ep.report_id = r.report_id) AS evidence_count
FROM REPORTS r
JOIN CITIZENS c ON c.citizen_id = r.citizen_id
WHERE r.status = 'Pending'
ORDER BY r.date_reported ASC;

-- --------------------------------------------------------------------------
-- 5B. Citizen_Challan_Summary — Citizen dashboard challan overview
-- --------------------------------------------------------------------------
CREATE VIEW Citizen_Challan_Summary AS
SELECT
    ch.challan_id,
    ch.citizen_id,
    ch.total_amount,
    ch.payment_status,
    ch.issue_date,
    ch.due_date,
    ch.paid_at,
    ch.transaction_ref,
    vr.rule_name,
    vr.severity,
    ve.location_coords,
    po.full_name       AS issuing_officer,
    po.station_code
FROM CHALLANS ch
JOIN VIOLATION_EVENTS ve ON ve.event_id = ch.event_id
JOIN VIOLATION_RULES  vr ON vr.rule_id  = ve.rule_id
JOIN POLICE_OFFICERS  po ON po.badge_no = ch.badge_no
ORDER BY ch.issue_date DESC;

-- --------------------------------------------------------------------------
-- 5C. Officer_Performance_View — Stats per officer
-- --------------------------------------------------------------------------
CREATE VIEW Officer_Performance_View AS
SELECT
    po.badge_no,
    po.full_name,
    po.station_code,
    (SELECT COUNT(*) FROM REPORTS r WHERE r.reviewed_by = po.badge_no AND r.status = 'Verified')  AS verified_count,
    (SELECT COUNT(*) FROM REPORTS r WHERE r.reviewed_by = po.badge_no AND r.status = 'Rejected')  AS rejected_count,
    (SELECT COUNT(*) FROM CHALLANS c WHERE c.badge_no = po.badge_no)                               AS challans_issued,
    (SELECT COALESCE(SUM(c.total_amount), 0) FROM CHALLANS c WHERE c.badge_no = po.badge_no AND c.payment_status = 'Paid') AS revenue_collected
FROM POLICE_OFFICERS po
WHERE po.is_active = TRUE;

-- --------------------------------------------------------------------------
-- 5D. Citizen_Trust_History — Temporal view of trust score changes
-- --------------------------------------------------------------------------
CREATE VIEW Citizen_Trust_History AS
SELECT
    ch.history_id,
    ch.citizen_id,
    c.full_name,
    ch.trust_score,
    ch.reward_points,
    ch.account_status,
    ch.valid_from,
    ch.valid_to,
    ch.operation_type,
    ch.changed_at,
    ch.changed_by
FROM CITIZENS_HISTORY ch
JOIN CITIZENS c ON c.citizen_id = ch.citizen_id
ORDER BY ch.citizen_id, ch.valid_from;


-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6A. Citizens  (password: password123)
--     bcrypt hash for 'password123'
-- --------------------------------------------------------------------------
INSERT INTO CITIZENS (full_name, email, phone_no, password_hash, trust_score, reward_points, account_status) VALUES
('Aarav Sharma',    'aarav@example.com',    '9876543210', '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', 75, 15, 'Active'),
('Priya Patel',     'priya@example.com',    '9876543211', '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', 50, 5,  'Active'),
('Rohan Mehta',     'rohan@example.com',    '9876543212', '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', 30, 0,  'Active'),
('Sneha Reddy',     'sneha@example.com',    '9876543213', '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', 90, 25, 'Active'),
('Vikram Singh',    'vikram@example.com',   '9876543214', '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', 10, 0,  'Suspended');

-- --------------------------------------------------------------------------
-- 6B. Police Officers  (password: police123)
-- --------------------------------------------------------------------------
INSERT INTO POLICE_OFFICERS (badge_no, full_name, officer_rank, station_code, email, password_hash, phone_no) VALUES
('TN-4521',  'Inspector Rajesh Kumar',   'Inspector',          'CHN-T-NAGAR',     'rajesh@police.gov',   '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', '9900001111'),
('TN-3310',  'SI Lakshmi Narayanan',     'Sub-Inspector',      'CHN-ADYAR',       'lakshmi@police.gov',  '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', '9900002222'),
('TN-7788',  'ASI Deepak Verma',         'Asst Sub-Inspector', 'CHN-ANNA-NAGAR',  'deepak@police.gov',   '$2b$12$LJ3m4ys3Lp0KP5HUvFqXaeK8RKj5pXw0v8jY5bN.V4T5z3mHvXS2u', '9900003333');

-- --------------------------------------------------------------------------
-- 6C. Violation Rules (12 comprehensive rules)
-- --------------------------------------------------------------------------
INSERT INTO VIOLATION_RULES (rule_code, rule_name, description, base_fine_amount, severity, violation_time) VALUES
('SPD-001', 'Speeding',                  'Exceeding posted speed limit',                           2000.00, 'Major',    'Anytime'),
('RLT-002', 'Red Light Violation',       'Failure to stop at red traffic signal',                   5000.00, 'Critical', 'Anytime'),
('HLM-003', 'No Helmet',                 'Riding two-wheeler without protective helmet',            1000.00, 'Moderate', 'Anytime'),
('SBT-004', 'No Seatbelt',              'Driving without fastened seatbelt',                        1000.00, 'Moderate', 'Anytime'),
('WPK-005', 'Wrong-Side Parking',       'Parking on incorrect side or no-parking zone',             1500.00, 'Minor',    'Anytime'),
('DUI-006', 'Drunk Driving',            'Operating vehicle under influence of alcohol/substances',  10000.00, 'Critical', 'Nighttime'),
('PHN-007', 'Using Phone While Driving','Operating mobile device while driving',                     3000.00, 'Major',    'Anytime'),
('OVL-008', 'Overloading',              'Vehicle carrying passengers/cargo beyond permitted limit',  4000.00, 'Major',    'Anytime'),
('NLC-009', 'No Driving License',       'Driving without valid driving license',                     5000.00, 'Critical', 'Anytime'),
('NIN-010', 'No Insurance',             'Operating uninsured vehicle on public road',                3000.00, 'Major',    'Anytime'),
('WSR-011', 'Wrong-Side Driving',       'Driving on the wrong side of the road',                     5000.00, 'Critical', 'Anytime'),
('HRN-012', 'Unnecessary Honking',      'Excessive or unnecessary use of horn in silent zone',       1000.00, 'Minor',    'Anytime');

-- --------------------------------------------------------------------------
-- 6D. Vehicles
-- --------------------------------------------------------------------------
INSERT INTO VEHICLES (plate_no, vehicle_model, vehicle_type, owner_name, owner_type) VALUES
('TN-01-AB-1234', 'Maruti Swift',       'Car',          'Aarav Sharma',     'Individual'),
('TN-01-CD-5678', 'Honda Activa',       'Motorcycle',   'Priya Patel',      'Individual'),
('TN-02-EF-9012', 'Tata Nexon',         'Car',          'Rohan Mehta',      'Individual'),
('TN-03-GH-3456', 'Royal Enfield',      'Motorcycle',   'Vikram Singh',     'Individual'),
('TN-04-IJ-7890', 'Ashok Leyland',      'Truck',        'Reddy Transport',  'Corporate'),
('TN-05-KL-2345', 'BMW 3 Series',       'Car',          'Sneha Reddy',      'Individual');

-- --------------------------------------------------------------------------
-- 6E. Sample Reports
-- --------------------------------------------------------------------------
INSERT INTO REPORTS (citizen_id, plate_no, location_coords, location_address, description, date_reported, status) VALUES
(1, 'TN-01-CD-5678', '13.0827,80.2707', 'Anna Salai, T. Nagar, Chennai',             'Bike running red light at T. Nagar junction',         '2025-04-10 09:30:00', 'Pending'),
(1, 'TN-02-EF-9012', '13.0604,80.2496', 'Adyar Signal, Chennai',                      'Car speeding in school zone near Adyar bridge',        '2025-04-11 14:15:00', 'Pending'),
(2, 'TN-03-GH-3456', '13.0850,80.2101', 'Anna Nagar Roundabout, Chennai',              'Motorcycle rider without helmet on main road',          '2025-04-12 08:45:00', 'Pending'),
(4, 'TN-04-IJ-7890', '13.0674,80.2376', 'Mount Road, Guindy, Chennai',                 'Overloaded truck blocking left lane',                   '2025-04-13 16:00:00', 'Verified'),
(2, 'TN-01-AB-1234', '13.0524,80.2508', 'Velachery Main Road, Chennai',                'Driver using phone while driving on OMR',               '2025-04-14 11:30:00', 'Rejected');

-- --------------------------------------------------------------------------
-- 6F. Violation Events & Challans (for the Verified report #4)
-- --------------------------------------------------------------------------
INSERT INTO VIOLATION_EVENTS (report_id, rule_id, plate_no, location_coords, notes)
VALUES (4, 8, 'TN-04-IJ-7890', '13.0674,80.2376', 'Violation: Overloading');

INSERT INTO CHALLANS (event_id, citizen_id, badge_no, total_amount, payment_status, issue_date, due_date)
VALUES (1, 4, 'TN-4521', 4000.00, 'Unpaid', '2025-04-13', '2025-05-13');

-- --------------------------------------------------------------------------
-- 6G. Evidence Photos
-- --------------------------------------------------------------------------
INSERT INTO EVIDENCE_PHOTOS (report_id, image_url, caption) VALUES
(1, '/uploads/evidence/report_1_photo1.jpg', 'Red light violation - front view'),
(2, '/uploads/evidence/report_2_photo1.jpg', 'Speed captured near school zone'),
(3, '/uploads/evidence/report_3_photo1.jpg', 'No helmet - zoomed shot'),
(4, '/uploads/evidence/report_4_photo1.jpg', 'Overloaded truck - side view'),
(4, '/uploads/evidence/report_4_photo2.jpg', 'Overloaded truck - rear view');


-- ============================================================================
-- 7. SCHEDULED EVENTS
-- ============================================================================

DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_daily_overdue_check
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
    DECLARE v_count INT;
    CALL sp_flag_overdue_challans(v_count);
END$$
DELIMITER ;


-- ============================================================================
-- END OF SCHEMA — Traffic Violation Management System
-- ============================================================================
