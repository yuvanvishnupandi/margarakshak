@echo off
echo ========================================================
echo Traffic Violation Management System - Resume Start Script
echo ========================================================
echo.

:: Start the backend
echo [1/2] Starting the Backend Server (MySQL required to be running)
start cmd /k "cd backend && npm start"

:: Wait a few seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start the frontend
echo [2/2] Starting the Frontend Development Server
start cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Servers are starting up! 
echo The frontend should open automatically in your browser.
echo You can use this local version to record your resume demo.
echo ========================================================
pause
