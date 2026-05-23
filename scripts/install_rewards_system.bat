@echo off
echo ========================================
echo Installing Rewards System Database
echo Tier-1 DBMS Compliance
echo ========================================
echo.

cd ..
cd db

echo Running rewards_system.sql...
mysql -u root -pyvpandi@11 traffic_violation_db < rewards_system.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Rewards System Installed Successfully!
    echo ========================================
    echo.
    echo Tables created:
    echo - REWARDS_CATALOG
    echo - REDEMPTION_HISTORY
    echo.
    echo Features added:
    echo - reward_points column in CITIZENS
    echo - Stored procedure: sp_calculate_reward_points
    echo - Trigger: trg_update_rewards_after_verification
    echo - View: Citizen_Rewards_Dashboard
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Installation failed!
    echo ========================================
    echo Please check your MySQL connection and try again.
    echo.
)

pause
