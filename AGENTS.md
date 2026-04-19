# AGENTS.md — Contexto para asistentes de IA

> Este archivo es leído por agentes de IA (Claude Code, Cursor, Codex, Aider, etc.)
> antes de actuar sobre el repo. La fuente canónica y detallada es [`CLAUDE.md`](./CLAUDE.md) —
> empieza por ahí si necesitas el cuadro completo.

## TL;DR

**BotTrading** es un bot de trading algorítmico para MetaTrader 5 (broker Deriv, cuenta demo)
con dashboard React para monitoreo. Corre en Windows 11 local, con autostart al login.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind v3 → `src/`
- **Backend:** Python 3.12 + FastAPI + `MetaTrader5` + pandas → `backend/`
- **Scripts de arranque/parada:** `scripts/*.bat`
- **Idioma del proyecto:** Español (logs, comentarios, commits)
- **Dueño:** Carlos Roa (DIDIMOSOFT LLC, Colombia, UTC-5)

## Estructura rápida

```
├── CLAUDE.md               ← contexto canónico (LEE ESTO PRIMERO)
├── AGENTS.md               ← este archivo
├── src/                    ← frontend React
├── backend/                ← FastAPI + lógica de trading
│   ├── main.py             app FastAPI + lifespan autostart
│   ├── bot_engine.py       scan loop async
│   ├── strategy.py         RSI+EMA200, modos conservative / reactive
│   ├── risk.py             sizing + circuit breakers
│   ├── position_manager.py BE@50%TP, trailing@80%TP
│   ├── shutdown_guard.py   BE diario 17:55, cierre forex viernes
│   └── mt5_client.py       wrapper MetaTrader5
└── scripts/                .bat de arranque, autostart, stop
```

## Cómo correr

- **Dev (manual):** `scripts/start_all.bat` arranca MT5 + backend + frontend + abre navegador.
- **Auto:** registrado en `HKCU\...\Run` vía `scripts/install_autostart.bat`.
- **Frontend:** `npm run dev` → http://localhost:5173
- **Backend:** FastAPI en http://127.0.0.1:8000 (endpoints en `CLAUDE.md`)

## Gotchas críticos (no te los saltes)

1. **AutoTrading de MT5 se parchea manualmente** en `%APPDATA%\MetaQuotes\Terminal\<HASH>\config\common.ini`.
   Si cambia el hash del terminal (reinstall), re-ejecutar `backend/enable_algo.py`.
2. **Deriv usa `ORDER_FILLING_FOK`, no IOC.** El fallback está en `bot_engine._send_order_with_fallback()`.
   No hardcodees `IOC`.
3. **Dos estrategias distintas por tipo de activo:**
   - Sintéticos → M15 + modo `reactive` (RSI 40/60)
   - Forex/Metal → H1 + modo `conservative` (RSI 30/70, solo 07-22 UTC)
4. **El bot solo toca posiciones con `magic=20261234`.** Nunca modifiques operaciones manuales del usuario.
5. **Pre-shutdown guard a las 17:55** aplica BE (lun-jue) o cierra forex/metal (vie).

## Convenciones

- **No tocar la estrategia base** sin consultar — el usuario prefiere que el bot solo gestione trades.
- **Commits y logs en español.**
- **`.env` está gitignored** — nunca commitear credenciales MT5.
- **No introducir WebSocket todavía** — polling 2-5s funciona y es el diseño aceptado.
- **Persistencia:** logs/signals viven en memoria. Si agregas persistencia, usar SQLite.

## Pendientes conocidos

Ver sección "Lo que NO está hecho" en `CLAUDE.md`. Resumen: backtesting real, editar
estrategia desde UI, WebSocket, migración a VPS, rotar password Deriv, persistencia,
notificaciones Telegram.

## Antes de actuar

1. Lee [`CLAUDE.md`](./CLAUDE.md) completo.
2. Si vas a modificar trading lógica → confirma con el usuario primero.
3. Si vas a tocar `common.ini` o credenciales → confirma.
4. Preferir editar archivos existentes antes que crear nuevos.
