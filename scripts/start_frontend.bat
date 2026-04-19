@echo off
REM Arranca el frontend Vite en ventana minimizada.

cd /d "C:\proyectos\bottrading"

REM Comprueba si ya está corriendo (puerto 5173)
netstat -an | find ":5173" | find "LISTENING" >NUL
if %errorlevel%==0 (
    echo [%time%] Frontend ya corriendo en :5173
    exit /b 0
)

if not exist "node_modules" (
    echo [%time%] ERROR: node_modules no existe. Corre 'npm install' una vez.
    exit /b 1
)

set NPM="C:\Program Files\nodejs\npm.cmd"
if not exist %NPM% (
    echo [%time%] ERROR: npm.cmd no encontrado en C:\Program Files\nodejs
    exit /b 1
)

echo [%time%] Arrancando frontend en :5173 con %NPM%...
start "BotTrading Frontend" /MIN cmd /c "%NPM% run dev > C:\proyectos\bottrading\scripts\frontend.log 2>&1"
exit /b 0
