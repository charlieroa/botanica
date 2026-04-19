@echo off
REM Arranca el backend FastAPI en ventana minimizada.

cd /d "C:\proyectos\bottrading\backend"

REM Verifica venv
if not exist "venv\Scripts\python.exe" (
    echo ERROR: venv no encontrado en backend\venv
    pause
    exit /b 1
)

REM Comprueba si ya está corriendo (puerto 8000)
netstat -an | find ":8000" | find "LISTENING" >NUL
if %errorlevel%==0 (
    echo [%time%] Backend ya corriendo en :8000
    exit /b 0
)

echo [%time%] Arrancando backend en :8000...
start "BotTrading Backend" /MIN "venv\Scripts\python.exe" main.py
exit /b 0
