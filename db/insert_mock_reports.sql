-- =====================================================
-- Traffic Violation Management System
-- Mock Data Injection: Reports 7-9
-- =====================================================
-- Run this script to add 3 new pending violation reports
-- for testing the Police Review Reports feature.
-- =====================================================

USE traffic_violation_db;

-- Insert 3 new pending reports
INSERT INTO REPORTS (citizen_id, plate_no, violation_type, location_address, status, date_reported) VALUES 
(1, 'TN-07-CK-9999', 'No Helmet', 'T. Nagar, Chennai', 'Pending', NOW()),
(1, 'TN-09-BK-1111', 'Wrong-Side Driving', 'Adyar, Chennai', 'Pending', NOW()),
(2, 'TN-01-AA-5555', 'Speeding', 'Marina Beach Road', 'Pending', NOW());

-- Verify the insertion
SELECT report_id, citizen_id, plate_no, violation_type, location_address, status, date_reported 
FROM REPORTS 
ORDER BY report_id DESC 
LIMIT 10;
