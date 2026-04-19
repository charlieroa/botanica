# Scripts de auto-arranque BotTrading

## Instalación (una sola vez)

1. Doble clic en `install_autostart.bat`
2. Acepta si Windows pide permisos

Desde ese momento, cada vez que inicies sesión en Windows:
- 30 segundos después del login
- Arranca MT5 (espera 15s a que cargue)
- Arranca backend Python en `:8000`
- Arranca frontend Vite en `:5173`
- Abre el navegador en el dashboard

## Uso diario

No tienes que hacer nada. Prendes el PC → inicias sesión → todo arranca solo.

## Scripts disponibles

| Script | Qué hace |
|---|---|
| `start_all.bat` | Arranque manual completo (por si quieres probar sin reiniciar) |
| `stop_all.bat` | Detiene backend + frontend. **NO cierra MT5** (posiciones con SL/TP siguen vivas) |
| `start_mt5.bat` | Solo MT5 |
| `start_backend.bat` | Solo backend |
| `start_frontend.bat` | Solo frontend |
| `install_autostart.bat` | Registra el arranque en Task Scheduler |
| `uninstall_autostart.bat` | Elimina el arranque automático |

## Logs

Cada arranque deja trazas en `startup.log` en esta carpeta.

## Consideración sobre horario

Si apagas el PC a las 18h y lo enciendes a las 8h:

- **Entre 18h y 8h**: el bot NO opera (PC apagado).
- **Posiciones abiertas a las 18h**: siguen vivas en el broker. Los SL/TP se ejecutan server-side aunque tu PC esté apagado.
- **Si quieres trading 24/7**: necesitas un VPS Windows.

## Trading 24/7

Para no depender de tu PC:

1. **VPS Windows** ($15–30/mes): ForexVPS, BeeksFX, Contabo, AWS EC2 Windows
2. Copia toda la carpeta `bottrading/` al VPS
3. Instala dependencias (Node, Python, MT5)
4. Corre `install_autostart.bat` en el VPS

El dashboard sigue accesible vía RDP o expones el puerto 5173 con un reverse proxy.

## Desinstalar todo

1. `uninstall_autostart.bat`
2. Eliminar carpeta `C:\proyectos\bottrading\`
