-- ============================================
-- Marga Rakshak - Appeals & Notifications Setup
-- Run this script to enable dispute and notification features
-- ============================================

USE traffic_violation_db;

-- ============================================
-- 1. CREATE APPEALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS APPEALS (
    appeal_id       INT AUTO_INCREMENT PRIMARY KEY,
    challan_id      INT             NOT NULL,
    citizen_id      INT             NOT NULL,
    reason          TEXT            NOT NULL,
    status          VARCHAR(50)     NOT NULL DEFAULT 'Pending',
    reviewed_by     VARCHAR(50)     NULL,
    reviewed_at     DATETIME        NULL,
    review_notes    TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_appeal_challan FOREIGN KEY (challan_id) REFERENCES CHALLANS(challan_id) ON DELETE CASCADE,
    CONSTRAINT fk_appeal_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    
    INDEX idx_appeal_status (status),
    INDEX idx_appeal_challan (challan_id),
    INDEX idx_appeal_citizen (citizen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Citizen challan dispute appeals';

-- ============================================
-- 2. CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    notif_id        INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    notif_type      VARCHAR(100)    NOT NULL,
    message         TEXT            NOT NULL,
    related_id      INT             NULL,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    
    INDEX idx_notification_citizen (citizen_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_type (notif_type),
    INDEX idx_notification_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='In-app notification system';

-- ============================================
-- 3. VERIFY TABLES CREATED
-- ============================================
SELECT 'APPEALS table created successfully!' AS Status;
SHOW TABLES LIKE 'APPEALS';

SELECT 'NOTIFICATIONS table created successfully!' AS Status;
SHOW TABLES LIKE 'NOTIFICATIONS';

-- ============================================
-- 4. ADD 'Disputed' AND 'Waived' TO CHALLANS STATUS CHECK (if exists)
-- ============================================
-- Note: If you have an ENUM constraint on CHALLANS.payment_status, run:
-- ALTER TABLE CHALLANS MODIFY COLUMN payment_status ENUM('Unpaid', 'Paid', 'Overdue', 'Disputed', 'Waived') NOT NULL DEFAULT 'Unpaid';

SELECT 'Setup complete! Appeals and Notifications are now enabled.' AS Status;
