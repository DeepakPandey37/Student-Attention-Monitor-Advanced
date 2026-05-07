@echo off
title BabeStart — Student Attention Monitor
color 0A

echo.
echo  ============================================
echo    BabeStart ^| Student Attention Monitor
echo  ============================================
echo.
echo  [1/3] Starting Flask backend...
start "Flask Backend" cmd /k "cd /d "%~dp0backend" && python app.py"

timeout /t 3 /nobreak > nul

echo  [2/3] Starting React frontend...
start "React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo  [3/3] Waiting for servers to boot...
timeout /t 5 /nobreak > nul

echo  Opening http://localhost:5173 ...
start http://localhost:5173

echo.
echo  Both servers are running in their windows.
echo  Close those windows to stop the app.
echo.
pause
