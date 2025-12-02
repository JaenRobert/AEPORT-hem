@echo off
chcp 65001 > nul
cls
echo.
echo ╔═════════════════════════════════════════════════════════╗
echo ║          ÆSI PORTAL - ALLT I ETT                        ║
echo ╚═════════════════════════════════════════════════════════╝
echo.

REM Start Python server in background
echo [1/3] Startar Python-server på http://localhost:8000...
timeout /t 1 /nobreak > nul
start "" python aesi_core.py

REM Wait for server to start
echo [2/3] Väntar på server startup...
timeout /t 3 /nobreak > nul

REM Open Chrome with index.html
echo [3/3] Öppnar Chrome...
start chrome "file:///%CD%\index.html"

echo.
echo ✓ System startat!
echo.
echo Tips:
echo  • Chrome öppnas automatiskt
echo  • Python server körs i bakgrunden
echo  • Navigera mellan: CHAT / ADMIN / PORTAL
echo  • Stäng detta fönster när du är klar
echo.
pause
