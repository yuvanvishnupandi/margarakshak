@echo off
echo ============================================
echo Marga Rakshak - Database Setup Script
echo Setting up Appeals and Notifications
echo ============================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set DB_DIR=%SCRIPT_DIR%..\db

echo Running database migration...
echo.

mysql -u root -pyvpandi@11 traffic_violation_db < "%DB_DIR%\setup_appeals_and_notifications.sql"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo SUCCESS! Database migration complete!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Restart your FastAPI backend (python main.py)
    echo 2. Refresh your browser (Ctrl+F5)
    echo 3. Try submitting an appeal again!
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR! Migration failed!
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Database 'traffic_violation_db' exists
    echo 3. Password is correct in the script
    echo.
)

pause
