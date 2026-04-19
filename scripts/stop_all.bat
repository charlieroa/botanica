@echo off
REM Detiene backend y frontend de forma segura.
REM Primero llama al shutdown guard para blindar posiciones (BE, o cerrar forex si es viernes).
REM MT5 no se toca — las posiciones con SL/TP/BE siguen vivas en el broker.

echo [%time%] Aplicando shutdown guard ^(blindaje / cerrar forex si es viernes^)...
curl -s -X POST http://127.0.0.1:8000/api/bot/pre-shutdown -H "Content-Type: application/json" -d "{\"force_close_all\":false}" >NUL 2>&1
if %errorlevel%==0 (
    echo     Guard aplicado correctamente.
) else (
    echo     No se pudo contactar el backend ^(probablemente ya detenido^).
)

echo [%time%] Deteniendo backend ^(:8000^)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F 2>NUL

echo [%time%] Deteniendo frontend ^(:5173^)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /PID %%p /F 2>NUL

echo [%time%] Servicios detenidos. MT5 sigue abierto.
echo     Posiciones blindadas siguen con sus SL/TP activos en el broker.
echo     Cierra MT5 manualmente si quieres.
exit /b 0
