-- ============================================================================
-- TRAFFIC REPORTS FEATURE - DATABASE ENHANCEMENT
-- ============================================================================
-- Adds new columns to existing REPORTS table for enhanced tracking
-- and inserts 8 realistic mock records for Chennai-based violations
-- ============================================================================

USE traffic_violation_db;

-- ============================================================================
-- PART 1: ALTER REPORTS TABLE TO ADD NEW COLUMNS
-- ============================================================================

-- Add vehicle_no column (alias for plate_no for consistency)
-- Note: plate_no already exists, we'll use it as vehicle_no in queries

-- Add violation_type column
ALTER TABLE REPORTS 
ADD COLUMN violation_type VARCHAR(100) DEFAULT NULL 
AFTER plate_no;

-- Add latitude and longitude columns for precise GPS coordinates
ALTER TABLE REPORTS 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL 
AFTER location_coords,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL 
AFTER latitude;

-- Add fine_amount column (default 0)
ALTER TABLE REPORTS 
ADD COLUMN fine_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 
AFTER status;

-- Update status ENUM to include 'Challan Issued'
ALTER TABLE REPORTS 
MODIFY COLUMN status ENUM('Pending', 'Verified', 'Rejected', 'Challan Issued') 
NOT NULL DEFAULT 'Pending';

-- Add assigned_badge_no column (FK to POLICE_OFFICERS, nullable)
-- Note: reviewed_by already exists, we'll use it as assigned_badge_no
-- For clarity, we can create a view or alias in queries

-- Add indexes for new columns
ALTER TABLE REPORTS 
ADD INDEX idx_report_violation_type (violation_type),
ADD INDEX idx_report_location (latitude, longitude),
ADD INDEX idx_report_fine (fine_amount);

-- ============================================================================
-- PART 2: INSERT 8 REALISTIC MOCK RECORDS (Chennai-based)
-- ============================================================================

-- Mock Report 1: Pending - Speeding violation on Anna Salai
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    date_reported
) VALUES (
    1, 
    'TN-01-AB-1234', 
    'Speeding',
    '13.0827,80.2707',
    13.0827,
    80.2707,
    'Anna Salai, T. Nagar, Chennai', 
    'Car speeding at 80 km/h in 40 km/h zone near T. Nagar junction', 
    'Pending',
    0.00,
    '2025-04-20 09:30:00'
);

-- Mock Report 2: Pending - Red light violation on OMR
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    date_reported
) VALUES (
    1, 
    'TN-02-CD-5678', 
    'Red Light Violation',
    '12.9845,80.2480',
    12.9845,
    80.2480,
    'OMR Sholinganallur Signal, Chennai', 
    'Motorcycle jumped red light at Sholinganallur junction during peak hours', 
    'Pending',
    0.00,
    '2025-04-21 14:15:00'
);

-- Mock Report 3: Pending - No helmet on ECR
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    date_reported
) VALUES (
    1, 
    'TN-03-EF-9012', 
    'No Helmet',
    '12.9352,80.2341',
    12.9352,
    80.2341,
    'ECR Road, Neelankarai, Chennai', 
    'Two-wheeler rider without helmet on ECR near Neelankarai beach', 
    'Pending',
    0.00,
    '2025-04-22 08:45:00'
);

-- Mock Report 4: Pending - Wrong side driving on Mount Road
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    date_reported
) VALUES (
    1, 
    'TN-04-GH-3456', 
    'Wrong-Side Driving',
    '13.0674,80.2376',
    13.0674,
    80.2376,
    'Mount Road, Guindy, Chennai', 
    'Auto rickshaw driving on wrong side near Guindy industrial estate', 
    'Pending',
    0.00,
    '2025-04-23 16:00:00'
);

-- Mock Report 5: Verified - Overloading (assigned to officer POL0001)
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    reviewed_by,
    reviewed_at,
    date_reported
) VALUES (
    1, 
    'TN-05-IJ-7890', 
    'Overloading',
    '13.0524,80.2508',
    13.0524,
    80.2508,
    'Velachery Main Road, Chennai', 
    'Tempo carrying 15 passengers in 8-seater capacity vehicle', 
    'Verified',
    0.00,
    'TN-4521',
    '2025-04-18 11:30:00',
    '2025-04-17 10:20:00'
);

-- Mock Report 6: Verified - Using phone while driving (assigned to officer POL0001)
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    reviewed_by,
    reviewed_at,
    date_reported
) VALUES (
    1, 
    'TN-06-KL-2345', 
    'Using Phone While Driving',
    '13.0878,80.2785',
    13.0878,
    80.2785,
    'Express Avenue, Royapettah, Chennai', 
    'SUV driver using mobile phone while driving on busy road', 
    'Verified',
    0.00,
    'TN-4521',
    '2025-04-19 15:45:00',
    '2025-04-19 09:10:00'
);

-- Mock Report 7: Challan Issued - Drunk driving with fine
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    reviewed_by,
    reviewed_at,
    date_reported
) VALUES (
    1, 
    'TN-07-MN-6789', 
    'Drunk Driving',
    '13.0569,80.2420',
    13.0569,
    80.2420,
    'GST Road, Chrompet, Chennai', 
    'Car driver suspected of drunk driving, failed breathalyzer test', 
    'Challan Issued',
    10000.00,
    'TN-4521',
    '2025-04-16 22:30:00',
    '2025-04-16 21:15:00'
);

-- Mock Report 8: Rejected - Insufficient evidence
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type,
    location_coords, 
    latitude,
    longitude,
    location_address, 
    description, 
    status,
    fine_amount,
    reviewed_by,
    reviewed_at,
    rejection_reason,
    date_reported
) VALUES (
    1, 
    'TN-08-OP-0123', 
    'Unnecessary Honking',
    '13.0732,80.2518',
    13.0732,
    80.2518,
    'Pondy Bazaar, T. Nagar, Chennai', 
    'Vehicle honking continuously in silent zone near hospital', 
    'Rejected',
    0.00,
    'TN-4521',
    '2025-04-15 13:20:00',
    'Blurry image, vehicle number plate not clearly visible',
    '2025-04-15 11:00:00'
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all records were inserted correctly:
-- SELECT report_id, citizen_id, plate_no, violation_type, location_address, 
--        status, fine_amount, reviewed_by, date_reported
-- FROM REPORTS 
-- ORDER BY 
--   CASE status 
--     WHEN 'Pending' THEN 1 
--     WHEN 'Verified' THEN 2 
--     WHEN 'Challan Issued' THEN 3 
--     WHEN 'Rejected' THEN 4 
--   END,
--   date_reported DESC;
