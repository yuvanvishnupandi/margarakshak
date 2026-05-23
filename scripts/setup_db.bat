@echo off
REM Traffic Violation Management System - Database Setup Script (Windows)
REM Run this script to initialize the MySQL database

echo ========================================
echo Traffic Violation DBMS - Database Setup
echo ========================================
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: MySQL command not found!
    echo Please add MySQL bin directory to your PATH or run this script from MySQL Command Line Client
    echo.
    echo Alternative: Open MySQL Workbench or MySQL CLI and run:
    echo   source C:\Users\yuvan\OneDrive\Documents\traffic_violation\db\schema.sql
    pause
    exit /b 1
)

REM Prompt for MySQL password
set /p MYSQL_PASSWORD="Enter MySQL root password (press Enter if no password): "

echo.
echo Initializing database...
echo This may take a few moments...
echo.

REM Execute schema.sql
if "%MYSQL_PASSWORD%"=="" (
    mysql -u root < "..\db\schema.sql"
) else (
    mysql -u root -p%MYSQL_PASSWORD% < "..\db\schema.sql"
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database setup completed successfully!
    echo ========================================
    echo.
    echo Database: traffic_violation_db
    echo Tables: 12 core + 2 history + 2 transient
    echo Triggers: 5
    echo Stored Procedures: 4
    echo Views: 4
    echo Seed Data: Citizens, Police, Vehicles, Rules, Reports
    echo.
    echo Next steps:
    echo 1. Install Python dependencies: cd server ^&^& pip install -r requirements.txt
    echo 2. Download OpenCV DNN models (see models/README.txt)
    echo 3. Start backend: cd server ^&^& python main.py
    echo 4. Start frontend: cd frontend ^&^& npm install ^&^& npm run dev
    echo.
) else (
    echo.
    echo ERROR: Database setup failed!
    echo Please check the error messages above and try again.
    echo.
)

pause
