@echo off
REM Elimina el arranque automatico.

set RUNKEY=HKCU\Software\Microsoft\Windows\CurrentVersion\Run
set NAME=BotTradingAutostart

reg delete %RUNKEY% /v %NAME% /f
if %errorlevel%==0 (
    echo Auto-arranque "%NAME%" eliminado.
) else (
    echo No se encontro el auto-arranque ^(puede que ya estuviera desinstalado^).
)
pause
