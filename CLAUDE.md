# BotTrading — Bot de trading MT5 + Deriv

Bot algorítmico que escanea forex, sintéticos de Deriv y oro en paralelo, abre/gestiona posiciones automáticamente via MT5 y expone un dashboard React para monitoreo.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS v3 + Recharts + lucide-react
- **Backend:** Python 3.12 + FastAPI + MetaTrader5 lib + pandas
- **Broker:** Deriv.com Limited (MT5, cuenta demo)
- **Host:** Windows 11 local (autostart via registro Run). Previsto migrar a VPS Windows más adelante.

## Árbol del proyecto

```
C:\proyectos\bottrading\
├── CLAUDE.md                       ← este archivo
├── src/                            ← frontend
│   ├── App.tsx                     orquesta vistas + polling API
│   ├── api/client.ts               tipos + wrappers fetch
│   ├── hooks/useApi.ts             hook polling genérico
│   ├── types.ts                    ViewId y títulos
│   ├── components/
│   │   ├── Sidebar, Header
│   │   ├── AlgoTradingBanner       aviso trade_allowed + test trade + reconectar
│   │   ├── BotControls             start/stop + config bot
│   │   ├── EquityChart, KpiCard, LogsPanel
│   │   ├── PositionsTable          usa datos reales si hay
│   │   ├── LiveAnalysis            tabla con RSI/EMA/zona por símbolo
│   │   └── TradeHistory
│   └── views/
│       ├── DashboardView           principal
│       ├── StrategiesView          (mock, por implementar con datos reales)
│       ├── BacktestingView         (mock)
│       ├── HistoryView, RiskView, LogsView, SettingsView
├── backend/
│   ├── main.py                     FastAPI + lifespan con autostart del bot
│   ├── mt5_client.py               wrapper MetaTrader5 (connect, account, positions, history)
│   ├── strategy.py                 RSI+EMA200+PA. Modos conservative / reactive
│   ├── risk.py                     position sizing + circuit breakers
│   ├── position_manager.py         breakeven @ 50% TP + trailing @ 80% TP
│   ├── shutdown_guard.py           BE diario + cerrar forex los viernes 17:55
│   ├── bot_engine.py               scan loop asyncio, paralelo sobre símbolos
│   ├── enable_algo.py              patch common.ini para forzar Experts.Enabled=1
│   ├── .env                        credenciales (gitignored)
│   ├── .env.example
│   └── venv/
└── scripts/
    ├── start_all.bat               orquesta MT5 + backend + frontend + navegador
    ├── start_mt5.bat, start_backend.bat, start_frontend.bat
    ├── stop_all.bat                llama guard + detiene servicios (NO cierra MT5)
    ├── install_autostart.bat       (ya instalado) registra en HKCU\...\Run
    ├── uninstall_autostart.bat
    └── startup.log                 trazas de cada arranque
```

## Estado actual (2026-04-17)

### Funcional y verificado
- Backend conecta a MT5 Deriv-Demo cuenta **32038845** (Carlos hernando Standard Demo, balance inicial $9039.47)
- Auto-start al login de Windows ya registrado en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` → `BotTradingAutostart`
- Bot autoarranca con `BOT_AUTOSTART=true` en `.env`
- Órdenes reales ejecutadas con éxito (primera test: ticket 8618288020 Volatility 75 Index; primera del bot: 8618288355 Crash 1000 Index)
- Shutdown guard disparado manualmente y aplicó BE correctamente

### Config activa del bot
```
Símbolos (8 en paralelo):
  synthetic (M15, modo reactive RSI 40/60):
    Volatility 75 Index, Volatility 100 Index, Boom 1000 Index, Crash 1000 Index
  forex (H1, modo conservative RSI 30/70, solo sesión 07-22 UTC):
    EURUSD, GBPUSD, USDJPY
  metal (H1, conservative):
    XAUUSD

Riesgo:
  1.0% por trade · máx 5 posiciones · 1 por símbolo
  Stop diario -3% · Drawdown máximo 10% · 3 pérdidas consecutivas → pausa

Trade management:
  SL inicial = entry ± ATR * 1.5 (o 2.0 en sintéticos)
  R:R = 1:2
  Breakeven automático al 50% del TP
  Trailing al 80% del TP, 1 ATR detrás

Pre-shutdown guard:
  17:55 lunes a jueves → BE en todas las posiciones del bot
  17:55 viernes       → cerrar forex + metal (gap weekend) + BE sintéticos
```

## Credenciales

- **`.env` está gitignored**. Contiene `MT5_LOGIN`, `MT5_PASSWORD`, `MT5_SERVER`, `MT5_PATH`, `BOT_AUTOSTART`, `BOT_SCAN_INTERVAL`.
- El path crítico: `MT5_PATH=C:\Program Files\MetaTrader 5\terminal64.exe` (NO el de `MetaTrader 5 Terminal\`, esa es otra instalación).
- **La password original fue compartida en chat** — Carlos debería rotarla en Deriv cuando termine de testear. Está en `.env` local nada más.

## Cómo arrancar

### Auto (ya instalado)
Prende el PC → login Windows → todo arranca solo en ~30s. Dashboard en `http://localhost:5173`.

### Manual sin reiniciar
Doble clic en `C:\proyectos\bottrading\scripts\start_all.bat`.

### Endpoints REST (`http://127.0.0.1:8000`)
```
GET  /api/status             estado MT5 (connected, trade_allowed, terminal_path)
POST /api/reconnect          forzar reconexión MT5
GET  /api/account            info cuenta Deriv
GET  /api/positions          posiciones abiertas en tiempo real
GET  /api/history?days=30    historial cerrado
GET  /api/summary            kpis + positions + recentTrades consolidado
GET  /api/symbols?search=... búsqueda símbolos del broker

GET  /api/bot/status         running, scans_total, signals_total, risk_state, management, guard
POST /api/bot/start          {interval: 30}
POST /api/bot/stop
GET  /api/bot/logs?limit=80
GET  /api/bot/signals?limit=30
GET  /api/bot/analysis       RSI/EMA/zone en vivo por símbolo
POST /api/bot/symbols        actualizar símbolos activos
POST /api/bot/test-trade     {symbol: "..."} orden mínima para verificar pipeline
POST /api/bot/pre-shutdown   {force_close_all: false} dispara el guard manualmente
```

## Decisiones arquitectónicas clave / gotchas

### 1. AutoTrading del terminal MT5 venía desactivado
El flag `terminal_info().trade_allowed` dependía de `[Experts] Enabled` en `common.ini` del terminal específico. Cuando Python llama `mt5.initialize(path=...)` puede lanzar un terminal headless con AutoTrading OFF. Se parcheó el archivo:
- `%APPDATA%\MetaQuotes\Terminal\D0E8209F77C8CF37AD8BF550E51FF075\config\common.ini`
- Cambios: `[Experts] Enabled=0 → 1`, `AllowDllImport=0 → 1`
- Backup en `common.ini.bak`
- Script reutilizable: `backend/enable_algo.py`

Ese hash `D0E8209F77C8CF37AD8BF550E51FF075` corresponde al terminal en `C:\Program Files\MetaTrader 5\`. Si se reinstala MT5 o se mueve, el hash cambia y hay que re-parchear.

### 2. Deriv usa ORDER_FILLING_FOK, no IOC
Las órdenes originales enviadas con `ORDER_FILLING_IOC` devolvían retcode 10030 "Unsupported filling mode". Se añadió fallback en `bot_engine._send_order_with_fallback()` que prueba FOK → IOC → RETURN hasta que encuentra uno soportado por el símbolo.

### 3. Estrategia separada por tipo de activo
Sintéticos: M15 + modo reactive (RSI 40/60, no requiere cruce estricto). Forex/metal: H1 + modo conservative (RSI 30/70, cruce estricto). Motivo: sintéticos son más volátiles pero mean-reverting, forex respeta mejor niveles clásicos.

### 4. Gestión de trade separada de estrategia de entrada
`position_manager.py` sólo opera sobre el SL de posiciones con `magic=20261234` (nuestras). No toca operaciones manuales del usuario. Runs cada ciclo del scan loop.

### 5. Pre-shutdown guard
Se ejecuta a las 17:55 desde el scan loop una sola vez al día (`should_trigger_now()` chequea hora + último día de ejecución). También disparable manualmente desde endpoint o desde `stop_all.bat`.

### 6. Polling en lugar de WebSocket
Frontend pollea cada 2-5s. Simple y funciona. Si la frecuencia molesta o hay mucho dato, el siguiente paso sería WebSocket vía FastAPI.

## Lo que NO está hecho / próximos pasos

1. **Backtesting real** — `views/BacktestingView.tsx` usa datos mock. Hay que implementar en el backend un módulo que corra la estrategia sobre velas históricas de MT5 y devuelva métricas.
2. **Editar estrategia desde UI** — `StrategiesView.tsx` muestra config hardcodeada. Endpoint para editar y persistir en disco/DB.
3. **WebSocket** para updates instantáneos.
4. **Migración a VPS Windows** — la limitación grande del setup actual es que el bot no opera cuando el PC está apagado (18h-8h). Preparado el setup para VPS en README de scripts.
5. **Rotar la password de Deriv** — fue compartida en chat.
6. **Persistencia** — logs, signals, bot state solo viven en memoria. Si se reinicia backend se pierden. Añadir SQLite o similar.
7. **Notificaciones Telegram** — la UI tiene la config pero backend no las envía aún.

## Preferencias y contexto del usuario

- **Nombre:** Carlos Roa (Colombia, UTC-5)
- **Empresa:** DIDIMOSOFT LLC
- **Idioma:** Español
- **Horario de uso del PC:** 8 AM – 6 PM, todos los días
- **Nivel:** aprendiendo trading algorítmico, viene de background de desarrollo
- **No quiere tocar la estrategia base** — prefiere que el bot gestione trades automáticamente (BE, trailing, guard)
- **Objetivo:** ver si el sistema genera resultados consistentes en demo antes de considerar capital real o migrar a VPS
