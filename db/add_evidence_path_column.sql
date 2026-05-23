-- ============================================================================
-- ADD EVIDENCE_PATH COLUMN TO REPORTS TABLE
-- This migration adds direct evidence path storage for police viewing
-- ============================================================================

USE traffic_violation_db;

-- Add evidence_path column to REPORTS table
ALTER TABLE REPORTS 
ADD COLUMN evidence_path VARCHAR(500) DEFAULT NULL COMMENT 'Path to uploaded evidence image' AFTER description;

-- Add index for better performance
ALTER TABLE REPORTS 
ADD INDEX idx_evidence_path (evidence_path);

-- Verify the column was added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'traffic_violation_db' 
  AND TABLE_NAME = 'REPORTS' 
  AND COLUMN_NAME = 'evidence_path';

SELECT 'Evidence path column added successfully!' AS status;
