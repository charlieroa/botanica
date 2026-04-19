# BotTrading

Bot de trading algorítmico para **MetaTrader 5** (broker Deriv, cuenta demo) con dashboard
React para monitoreo en tiempo real. Escanea forex, sintéticos de Deriv y oro en paralelo,
abre/gestiona posiciones automáticamente y expone una API REST para control.

> **Contexto completo del proyecto:** [`CLAUDE.md`](./CLAUDE.md)
> **Guía para asistentes de IA:** [`AGENTS.md`](./AGENTS.md)

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS v3 + Recharts
- **Backend:** Python 3.12 + FastAPI + `MetaTrader5` + pandas
- **Broker:** Deriv.com (MT5, cuenta demo)
- **Host:** Windows 11 local (autostart al login)

## Estructura

```
├── src/              frontend React
├── backend/          FastAPI + lógica de trading (strategy, risk, position manager, guard)
├── scripts/          .bat de arranque, autostart y parada
├── CLAUDE.md         contexto canónico del proyecto
└── AGENTS.md         guía rápida para agentes IA
```

## Arranque rápido

### Requisitos
- Windows 11 con MetaTrader 5 instalado (`C:\Program Files\MetaTrader 5\`)
- Node.js 18+ y Python 3.12
- Cuenta Deriv MT5 (demo)

### Setup inicial

```bash
# 1. Clonar
git clone https://github.com/charlieroa/botanica.git
cd botanica

# 2. Frontend
npm install

# 3. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 4. Credenciales
copy .env.example .env
# Editar .env con MT5_LOGIN, MT5_PASSWORD, MT5_SERVER, MT5_PATH
```

### Correr

**Todo junto:**
```bash
scripts\start_all.bat
```

**Manual (3 terminales):**
```bash
# Terminal 1: MT5
scripts\start_mt5.bat

# Terminal 2: backend
cd backend && venv\Scripts\activate && uvicorn main:app --reload

# Terminal 3: frontend
npm run dev
```

Dashboard en http://localhost:5173 · API en http://127.0.0.1:8000

### Autostart al login de Windows

```bash
scripts\install_autostart.bat
```

## Endpoints principales

```
GET  /api/status             estado MT5 (connected, trade_allowed)
GET  /api/account            info cuenta Deriv
GET  /api/positions          posiciones abiertas
GET  /api/summary            kpis + positions + trades recientes
GET  /api/bot/status         scans, signals, risk state, guard
POST /api/bot/start          arrancar scan loop
POST /api/bot/stop           parar scan loop
GET  /api/bot/analysis       RSI/EMA/zona en vivo por símbolo
POST /api/bot/test-trade     orden mínima de prueba
```

Lista completa en [`CLAUDE.md`](./CLAUDE.md#endpoints-rest).

## Configuración actual

- **Símbolos (8 en paralelo):** Volatility 75/100, Boom 1000, Crash 1000 (M15 reactive),
  EURUSD, GBPUSD, USDJPY, XAUUSD (H1 conservative, 07-22 UTC)
- **Riesgo:** 1% por trade · máx 5 posiciones · stop diario -3% · DD máx 10%
- **Management:** BE @ 50% TP · trailing @ 80% TP · R:R 1:2
- **Pre-shutdown guard:** 17:55 lun-jue BE · viernes cierra forex/metal

## Seguridad

- `.env` está en `.gitignore`. **Nunca** commitear credenciales.
- La cuenta es **demo**. No usar en real sin revisar riesgo y sin backtesting.

## Licencia

Proyecto personal. Sin licencia pública por ahora.
