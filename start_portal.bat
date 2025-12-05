@echo off
cd /d "%~dp0"
echo Skapar mappstruktur...
if not exist system mkdir system
if not exist memory mkdir memory
if not exist memory\logs mkdir memory\logs
if not exist memory\logs\json mkdir memory\logs\json
if not exist memory\logs\txt mkdir memory\logs\txt
echo Stopping any Python servers on ports 8000, 8001, 8080...
for %%P in (8000 8001 8080) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
    echo Killing process on port %%P (PID=%%a)...
    taskkill /F /PID %%a >nul 2>&1
  )
)
echo Starting ÆSI PORTAL backend...
python system\server.py
pause
