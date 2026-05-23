-- ============================================================================
-- WALLET REDEMPTION SYSTEM MIGRATION
-- ============================================================================
-- Adds wallet_balance column to CITIZENS and creates REDEMPTION_HISTORY table
-- Conversion Rate: 10 Reward Points = Rs. 50 Wallet Balance
-- ============================================================================

USE traffic_violation_db;

-- 1. Add wallet_balance column to CITIZENS table
ALTER TABLE CITIZENS
ADD COLUMN wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00
COMMENT 'Convertible wallet balance from reward points';

-- 2. Create REDEMPTION_HISTORY table for audit trail
CREATE TABLE IF NOT EXISTS REDEMPTION_HISTORY (
    redemption_id   INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id      INT             NOT NULL,
    points_redeemed INT             NOT NULL COMMENT 'Reward points converted',
    wallet_amount   DECIMAL(10,2)   NOT NULL COMMENT 'Wallet balance added (Rs.)',
    conversion_rate VARCHAR(50)     NOT NULL DEFAULT '10 points = Rs. 50',
    redeemed_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redemption_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    INDEX idx_redemption_citizen (citizen_id),
    INDEX idx_redemption_date (redeemed_at)
) ENGINE=InnoDB;

-- 3. Verify migration
SELECT 'Wallet Redemption System Migration Complete' AS status;
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'traffic_violation_db' 
  AND TABLE_NAME = 'CITIZENS' 
  AND COLUMN_NAME = 'wallet_balance';
