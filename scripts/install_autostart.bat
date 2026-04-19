@echo off
REM Registra el arranque automatico via registro HKCU\...\Run.
REM No requiere permisos de admin.

set RUNKEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Run
set NAME=BotTradingAutostart
set SCRIPT="C:\proyectos\bottrading\scripts\start_all.bat"

echo Registrando arranque automatico "%NAME%"...
reg add %RUNKEY% /v %NAME% /t REG_SZ /d %SCRIPT% /f

if %errorlevel% neq 0 (
    echo ERROR al registrar. Codigo: %errorlevel%
    pause
    exit /b 1
)

echo.
echo ===============================================
echo Auto-arranque instalado.
echo.
echo - Se ejecutara al iniciar sesion en Windows
echo - Log: C:\proyectos\bottrading\scripts\startup.log
echo - Desinstalar: doble clic en uninstall_autostart.bat
echo - Probar ya: doble clic en start_all.bat
echo ===============================================
pause
