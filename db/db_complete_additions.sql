-- ============================================================================
-- MARGA RAKSHAK — COMPLETE DB ADDITIONS (MySQL 8.0 Compatible)
-- Run ONCE on top of existing schema to add all missing pieces.
-- ============================================================================

USE traffic_violation_db;

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS (safe stored procedure approach)
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_add_column_if_missing;

DELIMITER $$
CREATE PROCEDURE sp_add_column_if_missing(
    IN tbl VARCHAR(100),
    IN col VARCHAR(100),
    IN col_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tbl
          AND COLUMN_NAME = col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', col_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- 1A. VEHICLES.citizen_id
CALL sp_add_column_if_missing('VEHICLES', 'citizen_id', 'INT NULL AFTER owner_name');

-- Add FK for citizen_id on VEHICLES if not exists
SET @fk_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'VEHICLES'
      AND CONSTRAINT_NAME = 'fk_vehicle_citizen'
);
SET @fk_sql = IF(@fk_exists = 0,
    'ALTER TABLE VEHICLES ADD CONSTRAINT fk_vehicle_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

-- 1B. CITIZENS.wallet_balance
CALL sp_add_column_if_missing('CITIZENS', 'wallet_balance',
    'DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''Wallet balance from reward points''');

-- 1C. CITIZENS rejection tracking columns
CALL sp_add_column_if_missing('CITIZENS', 'consecutive_rejections', 'INT NOT NULL DEFAULT 0');
CALL sp_add_column_if_missing('CITIZENS', 'total_rejections',       'INT NOT NULL DEFAULT 0');
CALL sp_add_column_if_missing('CITIZENS', 'ban_until',              'DATETIME DEFAULT NULL');
CALL sp_add_column_if_missing('CITIZENS', 'ban_reason',             'VARCHAR(500) DEFAULT NULL');

-- 1D. Fix REPORTS.status enum to include Challan Issued
ALTER TABLE REPORTS
  MODIFY COLUMN status
  ENUM('Pending','Verified','Rejected','Challan Issued')
  NOT NULL DEFAULT 'Pending';

DROP PROCEDURE IF EXISTS sp_add_column_if_missing;

-- ============================================================================
-- SECTION 2: ADD MISSING TABLES
-- ============================================================================

-- 2A. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notif_id    INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id  INT NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    notif_type  ENUM('Report Verified','Report Rejected','Challan Issued',
                     'Appeal Status','General') NOT NULL DEFAULT 'General',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_citizen FOREIGN KEY (citizen_id)
        REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_notif_citizen (citizen_id),
    INDEX idx_notif_read    (is_read),
    INDEX idx_notif_type    (notif_type),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB;

-- 2B. APPEALS
CREATE TABLE IF NOT EXISTS APPEALS (
    appeal_id    INT AUTO_INCREMENT PRIMARY KEY,
    challan_id   INT NOT NULL,
    citizen_id   INT NOT NULL,
    reason       TEXT NOT NULL,
    status       ENUM('Pending','Under Review','Accepted','Rejected') NOT NULL DEFAULT 'Pending',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by  VARCHAR(20) DEFAULT NULL,
    reviewed_at  DATETIME DEFAULT NULL,
    review_notes TEXT DEFAULT NULL,
    CONSTRAINT fk_appeal_challan  FOREIGN KEY (challan_id)  REFERENCES CHALLANS(challan_id)      ON DELETE CASCADE,
    CONSTRAINT fk_appeal_citizen  FOREIGN KEY (citizen_id)  REFERENCES CITIZENS(citizen_id)      ON DELETE CASCADE,
    CONSTRAINT fk_appeal_officer  FOREIGN KEY (reviewed_by) REFERENCES POLICE_OFFICERS(badge_no) ON DELETE SET NULL,
    INDEX idx_appeal_status  (status),
    INDEX idx_appeal_challan (challan_id),
    INDEX idx_appeal_citizen (citizen_id),
    INDEX idx_appeal_created (created_at)
) ENGINE=InnoDB;

-- 2C. REWARDS_CATALOG
CREATE TABLE IF NOT EXISTS REWARDS_CATALOG (
    reward_id         INT AUTO_INCREMENT PRIMARY KEY,
    reward_name       VARCHAR(100) NOT NULL,
    description       TEXT,
    points_required   INT NOT NULL,
    icon              VARCHAR(20),
    requirement_type  ENUM('verified_reports','trust_score','combined') NOT NULL,
    requirement_value INT NOT NULL,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_points_required (points_required),
    INDEX idx_is_active       (is_active)
) ENGINE=InnoDB;

-- 2D. REDEMPTION_HISTORY
CREATE TABLE IF NOT EXISTS REDEMPTION_HISTORY (
    redemption_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT NOT NULL,
    points_redeemed INT NOT NULL,
    wallet_amount   DECIMAL(10,2) NOT NULL,
    conversion_rate VARCHAR(50) NOT NULL DEFAULT '10 points = Rs. 50',
    redeemed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemption_citizen FOREIGN KEY (citizen_id)
        REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_redemption_citizen (citizen_id),
    INDEX idx_redemption_date    (redeemed_at)
) ENGINE=InnoDB;

-- 2E. PAYMENT_TRANSACTIONS — payment ledger
CREATE TABLE IF NOT EXISTS PAYMENT_TRANSACTIONS (
    txn_id          INT AUTO_INCREMENT PRIMARY KEY,
    challan_id      INT NOT NULL,
    citizen_id      INT NOT NULL,
    amount_paid     DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('UPI','NetBanking','Card','Cash','Wallet') NOT NULL DEFAULT 'UPI',
    transaction_ref VARCHAR(100) NOT NULL,
    paid_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_txn_challan FOREIGN KEY (challan_id) REFERENCES CHALLANS(challan_id) ON DELETE CASCADE,
    CONSTRAINT fk_txn_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_txn_challan (challan_id),
    INDEX idx_txn_citizen (citizen_id),
    INDEX idx_txn_paid    (paid_at)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 3: PERFORMANCE INDEXES (safe)
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_add_index_if_missing;
DELIMITER $$
CREATE PROCEDURE sp_add_index_if_missing(
    IN tbl VARCHAR(100), IN idx VARCHAR(100), IN col VARCHAR(100)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tbl AND INDEX_NAME = idx
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', idx, ' ON ', tbl, '(', col, ')');
        PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

CALL sp_add_index_if_missing('REPORTS',          'idx_report_plate',    'plate_no');
CALL sp_add_index_if_missing('VIOLATION_EVENTS', 'idx_ve_plate',        'plate_no');
CALL sp_add_index_if_missing('VEHICLES',         'idx_vehicle_citizen', 'citizen_id');

DROP PROCEDURE IF EXISTS sp_add_index_if_missing;

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_report_status_trust;
DROP TRIGGER IF EXISTS trg_report_notification;
DROP TRIGGER IF EXISTS trg_update_rewards_after_verification;
DROP TRIGGER IF EXISTS trg_appeal_accepted;

DELIMITER $$

-- Unified report status trigger: trust score + notifications
CREATE TRIGGER trg_report_status_trust
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_rejection_count INT DEFAULT 0;
    DECLARE v_total_rejections INT DEFAULT 0;
    DECLARE v_trust INT DEFAULT 0;

    IF OLD.status <> NEW.status THEN
        IF NEW.status = 'Verified' OR NEW.status = 'Challan Issued' THEN
            UPDATE CITIZENS
            SET trust_score            = LEAST(trust_score + 10, 100),
                reward_points          = reward_points + 5,
                consecutive_rejections = 0
            WHERE citizen_id = NEW.citizen_id;

            INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
            VALUES (NEW.citizen_id, 'Report Verified',
                CONCAT('Your report #', NEW.report_id,
                       ' has been verified. Trust score +10, Reward points +5!'));

        ELSEIF NEW.status = 'Rejected' THEN
            SELECT consecutive_rejections, total_rejections
            INTO v_rejection_count, v_total_rejections
            FROM CITIZENS WHERE citizen_id = NEW.citizen_id;

            SET v_rejection_count  = v_rejection_count + 1;
            SET v_total_rejections = v_total_rejections + 1;

            UPDATE CITIZENS
            SET trust_score            = GREATEST(trust_score - 10, 0),
                consecutive_rejections = v_rejection_count,
                total_rejections       = v_total_rejections
            WHERE citizen_id = NEW.citizen_id;

            SELECT trust_score INTO v_trust FROM CITIZENS WHERE citizen_id = NEW.citizen_id;
            IF v_trust <= 0 THEN
                UPDATE CITIZENS
                SET account_status = 'Suspended'
                WHERE citizen_id = NEW.citizen_id AND account_status = 'Active';
            END IF;

            INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
            VALUES (NEW.citizen_id, 'Report Rejected',
                CONCAT('Your report #', NEW.report_id,
                       ' was rejected. Trust score -10. Consecutive: ', v_rejection_count,
                       '. Reason: ', COALESCE(NEW.rejection_reason, 'Insufficient evidence')));
        END IF;
    END IF;
END$$

-- Appeal accepted/rejected trigger
CREATE TRIGGER trg_appeal_accepted
AFTER UPDATE ON APPEALS
FOR EACH ROW
BEGIN
    IF NEW.status = 'Accepted' AND OLD.status <> 'Accepted' THEN
        UPDATE CHALLANS
        SET payment_status = 'Waived'
        WHERE challan_id = NEW.challan_id;

        UPDATE CITIZENS
        SET trust_score = LEAST(trust_score + 5, 200)
        WHERE citizen_id = NEW.citizen_id;

        INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
        VALUES (NEW.citizen_id, 'Appeal Status',
            CONCAT('Appeal for Challan #', NEW.challan_id,
                   ' ACCEPTED. Challan waived. Trust score +5!'));

    ELSEIF NEW.status = 'Rejected' AND OLD.status <> 'Rejected' THEN
        UPDATE CHALLANS
        SET payment_status = 'Unpaid'
        WHERE challan_id = NEW.challan_id
          AND payment_status = 'Disputed';

        INSERT INTO NOTIFICATIONS (citizen_id, notif_type, message)
        VALUES (NEW.citizen_id, 'Appeal Status',
            CONCAT('Appeal for Challan #', NEW.challan_id,
                   ' REJECTED. Please pay. Reason: ',
                   COALESCE(NEW.review_notes, 'No reason provided')));
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- SECTION 5: VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW Habitual_Offenders_View AS
SELECT
    v.plate_no, v.vehicle_model, v.vehicle_type, v.owner_name,
    COUNT(ve.event_id) AS violation_count,
    COALESCE(SUM(ch.total_amount), 0) AS total_fines,
    COALESCE(SUM(CASE WHEN ch.payment_status IN ('Unpaid','Overdue')
                      THEN ch.total_amount ELSE 0 END), 0) AS unpaid_amount
FROM VEHICLES v
JOIN VIOLATION_EVENTS ve ON v.plate_no = ve.plate_no
LEFT JOIN CHALLANS ch ON ve.event_id = ch.event_id
GROUP BY v.plate_no, v.vehicle_model, v.vehicle_type, v.owner_name
HAVING violation_count >= 2
ORDER BY violation_count DESC;

CREATE OR REPLACE VIEW Revenue_By_Station_View AS
SELECT
    po.station_code,
    DATE_FORMAT(ch.issue_date, '%Y-%m') AS month,
    COUNT(ch.challan_id) AS challans_count,
    COALESCE(SUM(ch.total_amount), 0) AS total_issued,
    COALESCE(SUM(CASE WHEN ch.payment_status='Paid' THEN ch.total_amount ELSE 0 END), 0) AS revenue_collected
FROM CHALLANS ch
JOIN POLICE_OFFICERS po ON ch.badge_no = po.badge_no
GROUP BY po.station_code, month
ORDER BY month DESC, revenue_collected DESC;

CREATE OR REPLACE VIEW Overdue_Challans_View AS
SELECT
    ch.challan_id, ch.citizen_id, ch.total_amount, ch.due_date, ch.payment_status,
    c.full_name AS citizen_name, c.email AS citizen_email, c.phone_no,
    ol.flagged_at, ol.penalty_amount
FROM CHALLANS ch
JOIN CITIZENS c ON ch.citizen_id = c.citizen_id
LEFT JOIN OVERDUE_LOG ol ON ch.challan_id = ol.challan_id
WHERE ch.payment_status IN ('Overdue','Unpaid')
  AND ch.due_date < CURDATE()
ORDER BY ch.due_date ASC;

CREATE OR REPLACE VIEW Payment_Transactions_View AS
SELECT
    pt.txn_id, pt.challan_id, pt.citizen_id,
    c.full_name AS citizen_name,
    pt.amount_paid, pt.payment_method, pt.transaction_ref, pt.paid_at,
    vr.rule_name, ve.plate_no
FROM PAYMENT_TRANSACTIONS pt
JOIN CITIZENS c ON pt.citizen_id = c.citizen_id
JOIN CHALLANS ch ON pt.challan_id = ch.challan_id
JOIN VIOLATION_EVENTS ve ON ch.event_id = ve.event_id
JOIN VIOLATION_RULES vr ON ve.rule_id = vr.rule_id
ORDER BY pt.paid_at DESC;

-- ============================================================================
-- SECTION 6: STORED PROCEDURES
-- ============================================================================

DROP PROCEDURE IF EXISTS sp_submit_appeal;
DROP PROCEDURE IF EXISTS sp_review_appeal;
DROP PROCEDURE IF EXISTS sp_calculate_reward_points;

DELIMITER $$

CREATE PROCEDURE sp_submit_appeal(
    IN  p_challan_id  INT,
    IN  p_citizen_id  INT,
    IN  p_reason      TEXT,
    OUT p_result_code INT,
    OUT p_result_msg  VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_status   VARCHAR(20);
    DECLARE v_owner_id INT;
    DECLARE v_exist    INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK;
        SET p_result_code = -1;
        SET p_result_msg  = 'SQLEXCEPTION: Appeal submission rolled back.';
    END;

    SET p_result_code = 0; SET p_result_msg = '';
    START TRANSACTION;

    SELECT payment_status, citizen_id
    INTO v_status, v_owner_id
    FROM CHALLANS WHERE challan_id = p_challan_id FOR UPDATE;

    IF v_owner_id IS NULL THEN
        SET p_result_code=-2; SET p_result_msg='Challan not found.';
        ROLLBACK; LEAVE proc_body;
    END IF;
    IF v_owner_id <> p_citizen_id THEN
        SET p_result_code=-3; SET p_result_msg='Unauthorized.';
        ROLLBACK; LEAVE proc_body;
    END IF;
    IF v_status IN ('Paid','Waived') THEN
        SET p_result_code=-4;
        SET p_result_msg=CONCAT('Cannot appeal a ', v_status,' challan.');
        ROLLBACK; LEAVE proc_body;
    END IF;

    SELECT COUNT(*) INTO v_exist
    FROM APPEALS WHERE challan_id=p_challan_id AND status IN ('Pending','Under Review');
    IF v_exist > 0 THEN
        SET p_result_code=-5; SET p_result_msg='Pending appeal already exists.';
        ROLLBACK; LEAVE proc_body;
    END IF;

    INSERT INTO APPEALS (challan_id, citizen_id, reason, status)
    VALUES (p_challan_id, p_citizen_id, p_reason, 'Pending');

    UPDATE CHALLANS SET payment_status='Disputed' WHERE challan_id=p_challan_id;

    SET p_result_code=1; SET p_result_msg='Appeal submitted successfully.';
    COMMIT;
END$$

CREATE PROCEDURE sp_review_appeal(
    IN  p_appeal_id   INT,
    IN  p_badge_no    VARCHAR(20),
    IN  p_decision    VARCHAR(20),
    IN  p_notes       TEXT,
    OUT p_result_code INT,
    OUT p_result_msg  VARCHAR(255)
)
proc_body: BEGIN
    DECLARE v_challan_id INT;
    DECLARE v_citizen_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN ROLLBACK;
        SET p_result_code=-1;
        SET p_result_msg='SQLEXCEPTION: Appeal review rolled back.';
    END;

    SET p_result_code=0; SET p_result_msg='';

    IF p_decision NOT IN ('Accepted','Rejected') THEN
        SET p_result_code=-2;
        SET p_result_msg='Decision must be Accepted or Rejected.';
        LEAVE proc_body;
    END IF;

    START TRANSACTION;

    SELECT challan_id, citizen_id
    INTO v_challan_id, v_citizen_id
    FROM APPEALS WHERE appeal_id=p_appeal_id FOR UPDATE;

    IF v_challan_id IS NULL THEN
        SET p_result_code=-3; SET p_result_msg='Appeal not found.';
        ROLLBACK; LEAVE proc_body;
    END IF;

    UPDATE APPEALS
    SET status=p_decision, reviewed_at=NOW(),
        review_notes=p_notes, reviewed_by=p_badge_no
    WHERE appeal_id=p_appeal_id;

    SET p_result_code=1;
    SET p_result_msg=CONCAT('Appeal ', p_decision,' successfully.');
    COMMIT;
END$$

CREATE PROCEDURE sp_calculate_reward_points(IN p_citizen_id INT)
BEGIN
    DECLARE v_verified INT;
    DECLARE v_trust    INT;
    DECLARE v_points   INT;

    SELECT COUNT(*) INTO v_verified
    FROM REPORTS
    WHERE citizen_id=p_citizen_id AND status IN ('Verified','Challan Issued');

    SELECT trust_score INTO v_trust FROM CITIZENS WHERE citizen_id=p_citizen_id;

    SET v_points = v_verified * 10;
    IF v_trust >= 90 THEN SET v_points = v_points + 100;
    ELSEIF v_trust >= 70 THEN SET v_points = v_points + 50;
    END IF;

    UPDATE CITIZENS SET reward_points=v_points WHERE citizen_id=p_citizen_id;
    SELECT v_points AS calculated_points, v_verified AS verified_reports, v_trust AS trust_score;
END$$

DELIMITER ;

-- ============================================================================
-- SECTION 7: SCHEDULED EVENTS (safe re-create)
-- ============================================================================

DROP EVENT IF EXISTS evt_purge_expired_sessions;
DROP EVENT IF EXISTS evt_purge_unverified_uploads;

DELIMITER $$
CREATE EVENT IF NOT EXISTS evt_purge_expired_sessions
ON SCHEDULE EVERY 1 HOUR STARTS CURRENT_TIMESTAMP
DO BEGIN
    DELETE FROM ACTIVE_SESSIONS WHERE expires_at < NOW();
END$$

CREATE EVENT IF NOT EXISTS evt_purge_unverified_uploads
ON SCHEDULE EVERY 6 HOUR STARTS CURRENT_TIMESTAMP
DO BEGIN
    DELETE FROM UNVERIFIED_UPLOADS WHERE expires_at < NOW() AND is_linked = FALSE;
END$$
DELIMITER ;

-- ============================================================================
-- SECTION 8: SEED REWARDS CATALOG
-- ============================================================================
INSERT IGNORE INTO REWARDS_CATALOG
    (reward_name, description, points_required, icon, requirement_type, requirement_value)
VALUES
('Road Safety Champion', '5 reports verified',        50,   '🏆', 'verified_reports', 5),
('Trusted Citizen',      'Trust score above 70',       100,  '⭐', 'trust_score',      70),
('Community Guardian',   '10 reports verified',        150,  '🛡️', 'verified_reports', 10),
('Excellence Award',     'Trust score above 90',       250,  '💎', 'trust_score',      90),
('Elite Reporter',       '25 reports verified',        500,  '👑', 'verified_reports', 25),
('Legend Status',        'Perfect trust score of 100', 1000, '🌟', 'trust_score',      100);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'DB additions applied successfully!' AS status;

SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'traffic_violation_db'
  AND TABLE_NAME IN (
    'NOTIFICATIONS','APPEALS','REWARDS_CATALOG',
    'REDEMPTION_HISTORY','PAYMENT_TRANSACTIONS'
  )
ORDER BY TABLE_NAME;

SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA='traffic_violation_db'
ORDER BY TRIGGER_NAME;

SELECT ROUTINE_NAME
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA='traffic_violation_db' AND ROUTINE_TYPE='PROCEDURE'
ORDER BY ROUTINE_NAME;
