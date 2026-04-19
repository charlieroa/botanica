@echo off
REM Orquesta el arranque completo de BotTrading.
REM Orden:
REM  1. MT5  (espera 15s a que cargue y se autologuee)
REM  2. Backend  (espera 5s a que se conecte a MT5)
REM  3. Frontend  (espera 5s a que Vite compile)
REM  4. Navegador en http://localhost:5173
REM
REM Se ejecuta al iniciar sesion via Task Scheduler (install_autostart.bat).

setlocal
set SCRIPTS=%~dp0
set LOGFILE=%SCRIPTS%startup.log

REM Rota logs viejos si estan bloqueados por procesos huerfanos
if exist "%LOGFILE%" (
    >>"%LOGFILE%" (echo.) 2>NUL
    if errorlevel 1 (
        move /Y "%LOGFILE%" "%LOGFILE%.stuck-%RANDOM%.old" >NUL 2>&1
    )
)

echo =============================================== >> "%LOGFILE%"
echo [%date% %time%] Iniciando BotTrading >> "%LOGFILE%"

REM 1. MT5
call "%SCRIPTS%start_mt5.bat" >> "%LOGFILE%" 2>&1
echo [%time%] Esperando 15s a que MT5 cargue... >> "%LOGFILE%"
ping -n 16 127.0.0.1 >NUL 2>&1

REM 2. Backend Python
call "%SCRIPTS%start_backend.bat" >> "%LOGFILE%" 2>&1
echo [%time%] Esperando 8s a que el backend se conecte... >> "%LOGFILE%"
ping -n 9 127.0.0.1 >NUL 2>&1

REM 3. Frontend Vite
call "%SCRIPTS%start_frontend.bat" >> "%LOGFILE%" 2>&1
echo [%time%] Esperando 10s a que Vite compile... >> "%LOGFILE%"
ping -n 11 127.0.0.1 >NUL 2>&1

REM 4. Navegador
echo [%time%] Abriendo navegador en dashboard... >> "%LOGFILE%"
start "" "http://localhost:5173"

echo [%date% %time%] BotTrading arriba. Dashboard: http://localhost:5173 >> "%LOGFILE%"
endlocal
exit /b 0
