@echo off
TITLE ÆSI SYSTEM CORE [LOCALHOST]
COLOR 0A

:: KONTROLLERA OM PYTHON ÄR UPPE
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python hittades inte. Vänligen installera Python.
    pause
    exit /b 1
)

:MENU
echo.
echo ========================================================
echo      ÆSI PORTAL SUVERÄNITET (ENDAST LOKALT)
echo ========================================================
echo.
echo [1] STARTA LOKAL KONSOL (CORE ONLINE + http://localhost:8000)
echo [2] PUBLICERA SPEGEL (SYNC till GITHUB)
echo [3] AVSLUTA
echo.
set /p val="Välj handling (1-3): "

if "%val%"=="1" goto START_LOCAL
if "%val%"=="2" goto PUBLISH
if "%val%"=="3" goto END

echo Ogiltigt val.
goto MENU

:START_LOCAL
echo.
echo [REFLEX] Aktiverar ÆSI CORE.
echo [INFO]  Öppnar http://localhost:8000.
echo.

:: Kontrollera eller fråga efter API-nyckel (sätts för denna session)
if defined AE_MASTER_API_KEY goto KEY_OK
if defined GEMINI_API_KEY goto KEY_OK
echo.
echo Ingen lokal API-nyckel hittad i miljön.
set /p AE_MASTER_API_KEY="Ange Gemini API-nyckel (blir satt för denna session, tryck Enter för att fortsätta utan): "
if "%AE_MASTER_API_KEY%"=="" (
    echo Fortsätter utan API-nyckel (LLM-anrop kommer att misslyckas tills nyckel sätts).
) else (
    set "AE_MASTER_API_KEY=%AE_MASTER_API_KEY%"
)

:KEY_OK
:: Starta Python-servern i bakgrunden (miljövariabler är ärvda av child process)
start "ÆSI CORE" python aesi_core.py

:: Vänta 3 sekunder på att servern ska hinna starta
timeout /t 3 >nul

:: Öppna huvudsidan (index.html) i webbläsaren
start http://localhost:8000/index.html
goto END

:PUBLISH
echo.
echo [E1TAN MIRROR] INITIERAR SYNKRONISERING...
echo [INFO]  Använd denna endast om du har Git installerat och konfigurerat.
echo.
pause
:: Lägg till alla filer
git add .
git commit -m "ÆSI Puls: Dirigenten syncade Master Console"
git push origin master

echo.
echo [HAFTED] Arvskedjan Synkad. Spegeln är uppdaterad.
echo.
pause
goto END

:END
echo.
echo Avslutar controller.
