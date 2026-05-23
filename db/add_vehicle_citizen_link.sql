-- ============================================================================
-- MIGRATION: Add citizen_id foreign key to VEHICLES table
-- ============================================================================
-- Purpose: Link vehicles to their citizen owners for challan routing
-- ============================================================================

USE traffic_violation_db;

-- Add citizen_id column to VEHICLES table
ALTER TABLE VEHICLES 
ADD COLUMN citizen_id INT NULL AFTER owner_name,
ADD CONSTRAINT fk_vehicle_citizen 
FOREIGN KEY (citizen_id) REFERENCES CITIZENS(citizen_id) ON DELETE SET NULL;

-- Verify the migration
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'traffic_violation_db'
  AND TABLE_NAME = 'VEHICLES'
  AND COLUMN_NAME = 'citizen_id';

-- Show all foreign keys in VEHICLES table
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'traffic_violation_db'
  AND TABLE_NAME = 'VEHICLES'
  AND CONSTRAINT_NAME = 'fk_vehicle_citizen';

SELECT 'Migration completed successfully!' AS Status;
