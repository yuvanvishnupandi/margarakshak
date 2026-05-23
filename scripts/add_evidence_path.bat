@echo off
echo ========================================
echo Adding Evidence Path Column to REPORTS
echo Tier-1 DBMS Compliance
echo ========================================
echo.

cd ..
cd db

echo Running migration...
mysql -u root -pyvpandi@11 traffic_violation_db < add_evidence_path_column.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Migration Completed Successfully!
    echo ========================================
    echo.
    echo The evidence_path column has been added to REPORTS table.
    echo Police can now view evidence photos without errors.
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Migration failed!
    echo ========================================
    echo Please check your MySQL connection and try again.
    echo.
)

pause
