-- ============================================================================
-- CHALLAN APPEALS SYSTEM MIGRATION
-- ============================================================================
-- Creates APPEALS table for citizen dispute submissions
-- Note: CHALLANS.payment_status already includes 'Disputed' enum value
-- ============================================================================

USE traffic_violation_db;

-- 1. Create APPEALS table
CREATE TABLE IF NOT EXISTS APPEALS (
    appeal_id       INT AUTO_INCREMENT PRIMARY KEY,
    challan_id      INT             NOT NULL,
    citizen_id      INT             NOT NULL,
    reason          TEXT            NOT NULL COMMENT 'Citizen explanation for dispute',
    status          ENUM('Pending','Under Review','Accepted','Rejected') NOT NULL DEFAULT 'Pending',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by     VARCHAR(20)     DEFAULT NULL COMMENT 'Badge number of reviewing officer',
    reviewed_at     DATETIME        DEFAULT NULL,
    review_notes    TEXT            DEFAULT NULL COMMENT 'Officer decision explanation',
    CONSTRAINT fk_appeal_challan  FOREIGN KEY (challan_id)  REFERENCES CHALLANS(challan_id)  ON DELETE CASCADE,
    CONSTRAINT fk_appeal_citizen  FOREIGN KEY (citizen_id)  REFERENCES CITIZENS(citizen_id)  ON DELETE CASCADE,
    CONSTRAINT fk_appeal_officer  FOREIGN KEY (reviewed_by) REFERENCES POLICE_OFFICERS(badge_no) ON DELETE SET NULL,
    INDEX idx_appeal_status   (status),
    INDEX idx_appeal_challan  (challan_id),
    INDEX idx_appeal_citizen  (citizen_id),
    INDEX idx_appeal_created  (created_at)
) ENGINE=InnoDB;

-- 2. Verify migration
SELECT 'Challan Appeals System Migration Complete' AS status;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'traffic_violation_db' 
  AND TABLE_NAME = 'APPEALS';
