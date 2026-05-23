@echo off
echo ==========================================
echo MARGA RAKSHAK - INSTALL MYSQL TRIGGERS
echo Auto Trust Score Update System
echo ==========================================
echo.
echo This will install triggers that automatically:
echo - ADD 10 points when police VERIFY a report
echo - SUBTRACT 10 points when police REJECT a report
echo.
pause

echo.
echo Installing Auto_Reward_System and Auto_Penalty_System triggers...
echo.

cd /d "%~dp0"
mysql -u root -pyvpandi@11 traffic_violation_db < ..\db\database_triggers.sql

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Triggers installed.
    echo ==========================================
    echo.
    echo TRIGGER BEHAVIOR:
    echo   When Police VERIFY report:   trust_score +10
    echo   When Police REJECT report:   trust_score -10 (min 0)
    echo.
    echo AFFECTED PAGES:
    echo   - Profile Page (shows citizen trust score)
    echo   - Leaderboard (ranks by trust score)
    echo   - Analytics Dashboard
    echo   - Citizen Dashboard
    echo.
    echo TESTING:
    echo   1. Login as citizen - note trust score
    echo   2. Login as police - verify a report
    echo   3. Login as citizen again - trust score increased by 10!
    echo.
) else (
    echo.
    echo ==========================================
    echo ERROR! Trigger installation failed.
    echo ==========================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Database 'traffic_violation_db' exists
    echo   3. Credentials are correct
    echo.
)

pause
