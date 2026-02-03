@echo off
echo [PHANTOM] Cleaning up port conflicts...

:: Kill any process on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Terminating process %%a on port 8000...
    taskkill /F /PID %%a 2>nul
)

:: Kill any process on port 8002
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8002" ^| findstr "LISTENING"') do (
    echo Terminating process %%a on port 8002...
    taskkill /F /PID %%a 2>nul
)

echo [OK] Cleanup complete.
timeout /t 2 /nobreak >nul
