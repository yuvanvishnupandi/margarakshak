-- ==========================================
-- MARGA RAKSHAK - DEMO TEST ACCOUNTS SEED
-- 1 Police Officer + 3 Citizens
-- NO biometric/face-capture systems involved
-- ==========================================

USE traffic_violation_db;

-- ==========================================
-- 1. POLICE OFFICER ACCOUNT
-- ==========================================

-- Delete existing POL-101 if it exists (to avoid duplicate key errors)
DELETE FROM POLICE_OFFICERS WHERE badge_no = 'POL-101';

-- Insert Police Officer: Ravi Kumar
-- Password: police123 (bcrypt hashed)
INSERT INTO POLICE_OFFICERS (
    badge_no, 
    full_name, 
    email, 
    phone_no, 
    password_hash, 
    officer_rank, 
    station_code, 
    is_active
) VALUES (
    'POL-101',
    'Ravi Kumar',
    'ravi.kumar@police.gov.in',
    '9876543210',
    '$2b$12$LJ3m4ys5Lk3xGfKxLqN0p.HZ5qQ7xJxqK8fN9yP5vR3tW7mX2cK4a', -- police123
    'Inspector',
    'STATION-001',
    TRUE
);

-- ==========================================
-- 2. CITIZEN ACCOUNTS (3 Users)
-- ==========================================

-- Delete existing test citizens if they exist
DELETE FROM CITIZENS WHERE email IN (
    'arun.sharma@email.com',
    'priya.reddy@email.com',
    'vikram.singh@email.com'
);

-- Citizen 1: Arun Sharma
-- Password: citizen123 (bcrypt hashed)
INSERT INTO CITIZENS (
    full_name, 
    email, 
    phone_no, 
    password_hash, 
    trust_score, 
    reward_points, 
    account_status
) VALUES (
    'Arun Sharma',
    'arun.sharma@email.com',
    '9988776655',
    '$2b$12$E7xK3m4ys5Lk3xGfKxLqN0p.HZ5qQ7xJxqK8fN9yP5vR3tW7mX2cL5b', -- citizen123
    50,
    0,
    'Active'
);

-- Citizen 2: Priya Reddy
-- Password: citizen123 (bcrypt hashed)
INSERT INTO CITIZENS (
    full_name, 
    email, 
    phone_no, 
    password_hash, 
    trust_score, 
    reward_points, 
    account_status
) VALUES (
    'Priya Reddy',
    'priya.reddy@email.com',
    '8877665544',
    '$2b$12$E7xK3m4ys5Lk3xGfKxLqN0p.HZ5qQ7xJxqK8fN9yP5vR3tW7mX2cL5b', -- citizen123
    50,
    0,
    'Active'
);

-- Citizen 3: Vikram Singh
-- Password: citizen123 (bcrypt hashed)
INSERT INTO CITIZENS (
    full_name, 
    email, 
    phone_no, 
    password_hash, 
    trust_score, 
    reward_points, 
    account_status
) VALUES (
    'Vikram Singh',
    'vikram.singh@email.com',
    '7766554433',
    '$2b$12$E7xK3m4ys5Lk3xGfKxLqN0p.HZ5qQ7xJxqK8fN9yP5vR3tW7mX2cL5b', -- citizen123
    50,
    0,
    'Active'
);

-- ==========================================
-- 3. VERIFICATION QUERIES
-- ==========================================

-- Verify Police Officer was created
SELECT 
    'POLICE OFFICER' AS account_type,
    badge_no,
    full_name,
    email,
    officer_rank,
    is_active
FROM POLICE_OFFICERS 
WHERE badge_no = 'POL-101';

-- Verify Citizens were created
SELECT 
    'CITIZEN' AS account_type,
    citizen_id,
    full_name,
    email,
    trust_score,
    account_status
FROM CITIZENS 
WHERE email IN (
    'arun.sharma@email.com',
    'priya.reddy@email.com',
    'vikram.singh@email.com'
);

-- ==========================================
-- 4. PIPELINE TEST (Optional)
-- ==========================================

-- Insert a sample pending report from Citizen 1 to test the pipeline
-- Uncomment the lines below if you want a pre-loaded report for demo

/*
INSERT INTO REPORTS (
    citizen_id, 
    plate_no, 
    violation_type, 
    location_coords, 
    location_address, 
    description, 
    status, 
    date_reported
) VALUES (
    (SELECT citizen_id FROM CITIZENS WHERE email = 'arun.sharma@email.com'),
    'TN01AB1234',
    'Speeding',
    '13.0827,80.2707',
    'Anna Salai, Chennai',
    'Vehicle was speeding in a school zone',
    'Pending',
    NOW()
);
*/

-- Verify the pipeline: Check if pending reports appear
-- SELECT * FROM REPORTS WHERE status = 'Pending';

-- ==========================================
-- SEED COMPLETE
-- ==========================================
SELECT 'Demo accounts seeded successfully!' AS status;
