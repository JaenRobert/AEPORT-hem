@echo off
cd /d "%~dp0"
title AESI PORTAL - OMNI SCANNER LAUNCHER
color 0A
cls

echo ====================================================
echo    AESI PORTAL v5.4 - SYSTEM INITIALIZATION
echo ====================================================
echo.

echo [1] KONTROLLERAR SYSTEMKRAV...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEL] Python hittades inte! 
    echo Installera Python fran python.org och kryssa i "Add to PATH".
    pause
    exit
)
echo     - Python: OK

echo.
echo [2] SAKRAR MAPPSTRUKTUR (BRUNNEN)...
if not exist system mkdir system
if not exist memory mkdir memory
if not exist memory\logs mkdir memory\logs
if not exist memory\logs\json mkdir memory\logs\json
if not exist memory\logs\txt mkdir memory\logs\txt
if not exist memory\logs\gdoc mkdir memory\logs\gdoc
if not exist public mkdir public
echo     - Mappar: OK

echo.
echo [3] RENSAR GAMLA SIGNALER (PORT 8000-8080)...
:: Använder PowerShell för att kirurgiskt döda processer utan att krascha av sökvägen
powershell -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
powershell -Command "Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
powershell -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
echo     - Städning klar.

echo.
echo [4] STARTAR MODERSKEPPET...
echo     [INFO] Lat detta fonster vara oppet.
echo.
echo ====================================================

python system\server.py

if %errorlevel% neq 0 (
    echo.
    echo [KRITISKT FEL] Servern kraschade. Se ovan.
    pause
)
pause