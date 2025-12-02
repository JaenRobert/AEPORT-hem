@echo off
title ÆPORT - Full System Start [PRO]
color 0d

echo ============================================
echo        ÆPORT SYSTEM INITIALIZER PRO
echo ============================================

:: Kontrollera att Node.js finns
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [⚠] Node.js hittades inte. Installera via https://nodejs.org/
    pause
    exit /b
)

:: Kontrollera npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [⚠] npm hittades inte. Installationen av Node.js kan vara ofullständig.
    pause
    exit /b
)

echo [✔] Node och npm hittades.
echo.

:: Rensa cache och se till att beroenden är uppdaterade
echo [🧹] Städar cache och kontrollerar beroenden...
call npm cache verify >nul 2>nul
call npm audit fix --force >nul 2>nul
echo [✔] Cache rensad och beroenden kontrollerade.
echo.

:: Starta backend
echo [🚀] Startar ÆPORT backend (localhost:8000)...
start "ÆPORT Backend" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 1 >nul

:: Starta frontend
echo [🌐] Startar ÆPORT frontend (localhost:5173)...
start "ÆPORT Frontend" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 2 >nul

:: Visa status
echo.
echo ============================================
echo          ÆPORT SYSTEM STATUS
echo ============================================
echo  Backend:  http://localhost:8000   🟢 Aktiv
echo  Frontend: http://localhost:5173   🟢 Aktiv
echo ============================================
echo.

echo [INFO] Porten startar nu. Tryck [Ctrl + C] i respektive fönster för att avsluta.
echo.
pause
