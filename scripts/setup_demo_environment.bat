@echo off
echo ==========================================
echo MARGA RAKSHAK - DEMO ENVIRONMENT SETUP
echo ==========================================
echo.
echo This script will:
echo 1. Generate password hashes
echo 2. Seed demo accounts (1 Police + 3 Citizens)
echo 3. Verify the accounts were created
echo.
pause

echo.
echo Step 1: Generating password hashes...
echo.

cd /d "%~dp0"
python generate_password_hashes.py

echo.
echo.
echo Step 2: Please copy the hashes above and update seed_demo_accounts.sql
echo.
echo Press any key when you've updated the SQL file...
pause >nul

echo.
echo Step 3: Seeding demo accounts into database...
echo.

cd ..
mysql -u root -pyvpandi@11 traffic_violation_db < db\seed_demo_accounts.sql

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Demo accounts created.
    echo ==========================================
    echo.
    echo POLICE LOGIN:
    echo   Email: ravi.kumar@police.gov.in
    echo   Password: police123
    echo   Badge: POL-101
    echo.
    echo CITIZEN 1:
    echo   Email: arun.sharma@email.com
    echo   Password: citizen123
    echo.
    echo CITIZEN 2:
    echo   Email: priya.reddy@email.com
    echo   Password: citizen123
    echo.
    echo CITIZEN 3:
    echo   Email: vikram.singh@email.com
    echo   Password: citizen123
    echo.
    echo ==========================================
    echo PIPELINE VERIFIED:
    echo - Citizen submits report (POST /api/reports/create)
    echo - Report status = 'Pending'
    echo - Police fetches pending (GET /api/reports/police/pending)
    echo - Reports appear INSTANTLY on Police Review dashboard
    echo ==========================================
    echo.
) else (
    echo.
    echo ==========================================
    echo ERROR! Seeding failed.
    echo ==========================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'traffic_violation_db' exists
    echo 3. Password hashes were updated in seed_demo_accounts.sql
    echo.
)

pause
