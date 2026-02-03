@echo off
cd /d "C:\Users\26320\Desktop\女神异闻录project\phantom-lib\backend"
echo [PHANTOM] Starting Backend Server on port 8000...
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
