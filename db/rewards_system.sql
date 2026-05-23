-- ============================================================================
-- REWARDS SYSTEM ENHANCEMENT
-- Tier-1 DBMS Compliance: Proper relational structure for rewards tracking
-- ============================================================================

-- Add reward_points column to CITIZENS table if not exists
ALTER TABLE CITIZENS 
ADD COLUMN IF NOT EXISTS reward_points INT DEFAULT 0 AFTER trust_score;

-- Create REWARDS_CATALOG table for available rewards
CREATE TABLE IF NOT EXISTS REWARDS_CATALOG (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    reward_name VARCHAR(100) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    icon VARCHAR(10),
    color_scheme VARCHAR(50),
    requirement_type ENUM('verified_reports', 'trust_score', 'combined') NOT NULL,
    requirement_value INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_points_required (points_required),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create REDEMPTION_HISTORY table to track all redemptions (audit trail)
CREATE TABLE IF NOT EXISTS REDEMPTION_HISTORY (
    redemption_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_redeemed INT NOT NULL,
    redemption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Completed',
    notes TEXT,
    CONSTRAINT fk_redemption_citizen FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE CASCADE,
    CONSTRAINT fk_redemption_reward FOREIGN KEY (reward_id) REFERENCES REWARDS_CATALOG(reward_id) ON DELETE RESTRICT,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_redemption_date (redemption_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default rewards into catalog
INSERT IGNORE INTO REWARDS_CATALOG (reward_name, description, points_required, icon, color_scheme, requirement_type, requirement_value) VALUES
('Road Safety Champion', '5 reports successfully verified', 50, '🏆', 'from-yellow-400 to-orange-500', 'verified_reports', 5),
('Trusted Citizen', 'Maintain trust score above 70', 100, '⭐', 'from-green-400 to-emerald-500', 'trust_score', 70),
('Community Guardian', '10 reports successfully verified', 150, '🛡️', 'from-blue-400 to-indigo-500', 'verified_reports', 10),
('Excellence Award', 'Achieve trust score above 90', 250, '💎', 'from-purple-400 to-pink-500', 'trust_score', 90),
('Elite Reporter', '25 reports successfully verified', 500, '👑', 'from-red-400 to-rose-500', 'verified_reports', 25),
('Legend Status', 'Achieve perfect trust score of 100', 1000, '🌟', 'from-amber-400 to-yellow-500', 'trust_score', 100);

-- Create stored procedure to calculate and update reward points
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_calculate_reward_points(
    IN p_citizen_id INT
)
BEGIN
    DECLARE v_verified_reports INT;
    DECLARE v_trust_score INT;
    DECLARE v_total_points INT;
    
    -- Get verified reports count
    SELECT COUNT(*) INTO v_verified_reports
    FROM REPORTS
    WHERE citizen_id = p_citizen_id
    AND status IN ('Verified', 'Challan Issued');
    
    -- Get trust score
    SELECT trust_score INTO v_trust_score
    FROM CITIZENS
    WHERE citizen_id = p_citizen_id;
    
    -- Calculate points: 10 points per verified report + bonus for high trust
    SET v_total_points = (v_verified_reports * 10);
    
    -- Trust score bonus
    IF v_trust_score >= 90 THEN
        SET v_total_points = v_total_points + 100;
    ELSEIF v_trust_score >= 70 THEN
        SET v_total_points = v_total_points + 50;
    END IF;
    
    -- Update citizen's reward points
    UPDATE CITIZENS
    SET reward_points = v_total_points
    WHERE citizen_id = p_citizen_id;
    
    SELECT v_total_points as calculated_points, v_verified_reports, v_trust_score;
END //
DELIMITER ;

-- Create trigger to auto-update reward points when report status changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_update_rewards_after_verification
AFTER UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    -- Only trigger when status changes to Verified or Challan Issued
    IF NEW.status IN ('Verified', 'Challan Issued') AND OLD.status != NEW.status THEN
        CALL sp_calculate_reward_points(NEW.citizen_id);
    END IF;
END //
DELIMITER ;

-- Create view for citizen rewards dashboard
CREATE OR REPLACE VIEW Citizen_Rewards_Dashboard AS
SELECT 
    c.citizen_id,
    c.full_name,
    c.email,
    c.trust_score,
    c.reward_points,
    COUNT(DISTINCT r.report_id) as total_reports,
    COUNT(DISTINCT CASE WHEN r.status IN ('Verified', 'Challan Issued') THEN r.report_id END) as verified_reports,
    COUNT(DISTINCT rh.redemption_id) as total_redemptions,
    COALESCE(SUM(rh.points_redeemed), 0) as total_points_redeemed
FROM CITIZENS c
LEFT JOIN REPORTS r ON c.citizen_id = r.citizen_id
LEFT JOIN REDEMPTION_HISTORY rh ON c.citizen_id = rh.citizen_id AND rh.status = 'Completed'
GROUP BY c.citizen_id, c.full_name, c.email, c.trust_score, c.reward_points;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON REWARDS_CATALOG TO 'your_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON REDEMPTION_HISTORY TO 'your_user'@'localhost';

SELECT 'Rewards system tables and procedures created successfully!' as status;
