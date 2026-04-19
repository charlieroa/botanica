"""FastAPI app — expone datos MT5 al dashboard."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from pydantic import BaseModel

from mt5_client import client
import bot_engine

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ok = client.connect()
    print(f"[MT5] connected={ok} error={client.last_error}")

    autostart = os.getenv("BOT_AUTOSTART", "false").lower() in ("1", "true", "yes")
    if autostart and ok:
        interval = int(os.getenv("BOT_SCAN_INTERVAL", "30"))
        started = await bot_engine.start(interval=interval)
        print(f"[BOT] autostart={started} interval={interval}s")

    yield
    client.disconnect()
    print("[MT5] disconnected")


app = FastAPI(title="BotTrading API", version="0.1.0", lifespan=lifespan)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
def status():
    return client.status()


@app.post("/api/reconnect")
def reconnect():
    return client.reconnect()


@app.get("/api/account")
def account():
    return client.account()


@app.get("/api/positions")
def positions():
    return client.positions()


@app.get("/api/history")
def history(days: int = Query(30, ge=1, le=365)):
    return client.history(days)


@app.get("/api/symbols")
def symbols(search: str | None = None, limit: int = 500):
    return client.symbols(search=search, limit=limit)


@app.get("/api/summary")
def summary():
    """Resumen consolidado para el dashboard principal."""
    acc = client.account()
    pos = client.positions()
    hist = client.history(30)

    today_pnl = sum(t["pnl"] for t in hist if t["closedAt"].startswith(
        __import__("datetime").datetime.now().strftime("%Y-%m-%d")
    ))
    wins = [t for t in hist if t["pnl"] > 0]
    losses = [t for t in hist if t["pnl"] < 0]
    win_rate = (len(wins) / len(hist) * 100) if hist else 0

    return {
        "account": acc,
        "kpis": {
            "balance": acc.get("balance", 0),
            "equity": acc.get("equity", 0),
            "pnlToday": round(today_pnl, 2),
            "pnlTotal": round(sum(t["pnl"] for t in hist), 2),
            "winRate": round(win_rate, 1),
            "openPositions": len(pos),
            "tradesTotal": len(hist),
        },
        "positions": pos,
        "recentTrades": hist[:10],
    }


class StartRequest(BaseModel):
    interval: int = 30


class SymbolItem(BaseModel):
    symbol: str
    kind: str = "forex"
    timeframe: str = "H1"
    enabled: bool = True


class SymbolsRequest(BaseModel):
    symbols: list[SymbolItem]


@app.post("/api/bot/start")
async def bot_start(req: StartRequest):
    ok = await bot_engine.start(interval=req.interval)
    return {"ok": ok, "status": bot_engine.get_status()}


@app.post("/api/bot/stop")
async def bot_stop():
    ok = bot_engine.stop()
    return {"ok": ok, "status": bot_engine.get_status()}


@app.get("/api/bot/status")
def bot_status():
    return bot_engine.get_status()


@app.get("/api/bot/logs")
def bot_logs(limit: int = 100):
    return bot_engine.get_logs(limit)


@app.get("/api/bot/signals")
def bot_signals(limit: int = 50):
    return bot_engine.get_signals(limit)


@app.post("/api/bot/symbols")
def bot_set_symbols(req: SymbolsRequest):
    bot_engine.set_symbols([s.model_dump() for s in req.symbols])
    return {"ok": True, "symbols": bot_engine.get_status()["symbols"]}


@app.get("/api/bot/analysis")
def bot_analysis():
    return bot_engine.analyze_symbols()


class TestTradeRequest(BaseModel):
    symbol: str = "Volatility 10 Index"


@app.post("/api/bot/test-trade")
def bot_test_trade(req: TestTradeRequest):
    return bot_engine.test_trade(req.symbol)


class GuardRequest(BaseModel):
    force_close_all: bool = False


@app.post("/api/bot/pre-shutdown")
def bot_pre_shutdown(req: GuardRequest = GuardRequest()):
    """Dispara el shutdown guard manualmente. Si force_close_all=true, cierra TODAS
    las posiciones del bot (útil para llamarlo desde stop_all.bat)."""
    return bot_engine.run_guard(force_close_all=req.force_close_all)


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
