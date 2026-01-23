@echo off
title PHANTOM LIBRARY // LAUNCHER
color 0c

echo.
echo ========================================================
echo       P H A N T O M   L I B R A R Y   S Y S T E M
echo ========================================================
echo.
echo [*] Initializing Cognitive Engine...

:: 1. Start Backend (Python)
echo [*] Launching Backend Node (Port 8000)...
start "Phantom Backend" cmd /k "cd backend && title BACKEND && echo [PHANTOM] Waiting for connection... && uvicorn main:app --reload"

:: 2. Wait for Backend to warm up
timeout /t 3 /nobreak >nul

:: 3. Start Frontend (Vite)
echo [*] Launching Frontend Interface (Port 5173)...
start "Phantom Frontend" cmd /k "title FRONTEND && npm run dev"

echo.
echo [!] SYSTEM ONLINE.
echo [!] Access the Palace at: http://localhost:5173
echo.
pause
