@echo off
echo ==========================================
echo MARGA RAKSHAK - DATABASE MIGRATION
echo Add citizen_id to VEHICLES table
echo ==========================================
echo.
echo This migration will:
echo - Add citizen_id column to VEHICLES table
echo - Create foreign key link between VEHICLES and CITIZENS
echo - Enable challan routing to vehicle owners
echo.
pause

echo.
echo Running migration...
echo.

cd /d "%~dp0"
mysql -u root -pyvpandi@11 traffic_violation_db < ..\db\add_vehicle_citizen_link.sql

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo MIGRATION SUCCESSFUL!
    echo ==========================================
    echo.
    echo Next steps:
    echo   1. Restart backend server
    echo   2. Register new citizens (vehicle number now required)
    echo   3. Test challan creation flow
    echo.
    echo CHALLAN WORKFLOW:
    echo   Citizen registers with vehicle number
    echo   Citizen reports violation against violator vehicle
    echo   Police verifies and creates challan
    echo   Challan routed to violator's account
    echo   Violator sees challan in "My Challans" page
    echo.
) else (
    echo.
    echo ==========================================
    echo MIGRATION FAILED!
    echo ==========================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Database 'traffic_violation_db' exists
    echo   3. Credentials are correct in the script
    echo   4. Column doesn't already exist
    echo.
)

pause
