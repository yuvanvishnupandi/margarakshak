@echo off
echo ==========================================
echo MARGA RAKSHAK DBMS - STORED PROCEDURE DEPLOYMENT
echo ==========================================
echo.
echo This script will install the ACID-compliant stored procedure
echo into your traffic_violation_db database.
echo.
pause

echo.
echo Deploying ProcessReportAndIssueChallan stored procedure...
echo.

mysql -u root -pyvpandi@11 traffic_violation_db < ..\db\stored_procedure_process_report.sql

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Stored procedure deployed.
    echo ==========================================
    echo.
    echo DBMS Features Enabled:
    echo - ACID transaction compliance
    echo - Row-level locking (FOR UPDATE)
    echo - Foreign Key constraint safety (POL-101)
    echo - Automatic trigger execution
    echo - Exception handling with rollback
    echo.
) else (
    echo.
    echo ==========================================
    echo ERROR! Deployment failed.
    echo ==========================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'traffic_violation_db' exists
    echo 3. Credentials are correct in the script
    echo.
)

pause
