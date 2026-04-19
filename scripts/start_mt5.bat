@echo off
REM Lanza MetaTrader 5 (al que Python se conecta).
REM Si ya está abierto, Windows no abre otra instancia por defecto.

set MT5="C:\Program Files\MetaTrader 5\terminal64.exe"

tasklist /FI "IMAGENAME eq terminal64.exe" 2>NUL | find /I "terminal64.exe" >NUL
if %errorlevel%==0 (
    echo [%time%] MT5 ya esta corriendo, no lanzo nueva instancia
    exit /b 0
)

echo [%time%] Lanzando MetaTrader 5...
start "" %MT5%
exit /b 0
