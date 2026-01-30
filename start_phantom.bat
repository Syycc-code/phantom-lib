@echo off
title PHANTOM LIBRARY // LAUNCHER
color 0c

echo.
echo ========================================================
echo       P H A N T O M   L I B R A R Y   S Y S T E M
echo ========================================================
echo.

:: --- 1. PYTHON DETECTION ---
echo [*] detecting python environment...

:: Initialize with default
set PYTHON_CMD=python

:: Check Anaconda (Highest Priority)
if exist "C:\Users\26320\anaconda3\python.exe" (
    set PYTHON_CMD=C:\Users\26320\anaconda3\python.exe
    echo [OK] Anaconda Python found.
    goto :FOUND_PYTHON
)

:: Check System Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
    echo [OK] System Python found.
    goto :FOUND_PYTHON
)

:: If we get here, no python found
echo.
echo [!] CRITICAL ERROR: No Python installation found.
echo     Please install Python 3.10+ or check your Anaconda path.
echo.
pause
exit

:FOUND_PYTHON
echo [*] Using Python: %PYTHON_CMD%

:: --- 2. DEPENDENCY CHECK ---
echo [*] Checking libraries...
%PYTHON_CMD% -c "import uvicorn; import fastapi; import chromadb" >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Missing libraries. Installing dependencies...
    echo [*] Downloading from Tsinghua Mirror...
    %PYTHON_CMD% -m pip install -r backend/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if %errorlevel% neq 0 (
        echo [!] Install failed. Please check your network.
        pause
        exit
    )
    echo [OK] Libraries installed.
) else (
    echo [OK] Libraries ready.
)

:: --- 3. UPDATER ---
echo [*] Checking for updates...
%PYTHON_CMD% updater.py
echo.

:: --- 4. LAUNCH ---
echo [*] Starting Services...

:: Start Backend
start "Phantom Backend" cmd /k "cd backend && title BACKEND && echo [PHANTOM] Server Starting... && %PYTHON_CMD% -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Start Frontend
start "Phantom Frontend" cmd /k "title FRONTEND && npm run dev"

:: Open Browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo [!] SYSTEM ONLINE.
echo.
pause
