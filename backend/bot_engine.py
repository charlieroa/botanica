"""Bot engine: escanea múltiples símbolos en paralelo y ejecuta señales."""
import asyncio
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Literal, Optional
from collections import deque
import MetaTrader5 as mt5

from strategy import evaluate, StrategyConfig, Signal, PRESET_FOREX, PRESET_SYNTHETIC, PRESET_METAL
from risk import risk
from mt5_client import client as mt5_client
from position_manager import manage as manage_positions, ManagementConfig
import shutdown_guard

mgmt_cfg = ManagementConfig()
guard_cfg = shutdown_guard.GuardConfig()


def _cfg_for(kind: str) -> StrategyConfig:
    if kind == "synthetic":
        return PRESET_SYNTHETIC
    if kind == "metal":
        return PRESET_METAL
    return PRESET_FOREX


SymbolKind = Literal["forex", "synthetic", "metal", "crypto"]


@dataclass
class SymbolCfg:
    symbol: str
    kind: SymbolKind
    timeframe: str = "H1"
    enabled: bool = True


# Configuración por defecto: sintéticos + forex en paralelo
# M15 para más señales, H1 para forex (respeta niveles mejor)
DEFAULT_SYMBOLS: list[SymbolCfg] = [
    # Sintéticos (24/7, modo reactivo — RSI 40/60)
    SymbolCfg("Volatility 75 Index", "synthetic", "M15"),
    SymbolCfg("Volatility 100 Index", "synthetic", "M15"),
    SymbolCfg("Boom 1000 Index", "synthetic", "M15"),
    SymbolCfg("Crash 1000 Index", "synthetic", "M15"),
    # Forex majors (sesión Londres/NY, modo conservador — RSI 30/70)
    SymbolCfg("EURUSD", "forex", "H1"),
    SymbolCfg("GBPUSD", "forex", "H1"),
    SymbolCfg("USDJPY", "forex", "H1"),
    # Metal
    SymbolCfg("XAUUSD", "metal", "H1"),
]


@dataclass
class LogEvent:
    time: str
    level: Literal["INFO", "WARN", "ERROR", "TRADE"]
    symbol: Optional[str]
    message: str


@dataclass
class SignalRecord:
    time: str
    symbol: str
    side: str
    price: float
    sl: float
    tp: float
    rsi: float
    executed: bool
    reason: str
    execution_note: Optional[str] = None


@dataclass
class BotState:
    running: bool = False
    started_at: Optional[str] = None
    last_scan: Optional[str] = None
    scans_total: int = 0
    signals_total: int = 0
    trades_opened: int = 0
    start_equity: float = 0.0
    symbols: list[SymbolCfg] = field(default_factory=lambda: list(DEFAULT_SYMBOLS))
    logs: deque = field(default_factory=lambda: deque(maxlen=500))
    signals: deque = field(default_factory=lambda: deque(maxlen=200))


state = BotState()
_task: Optional[asyncio.Task] = None


def _log(level: str, message: str, symbol: Optional[str] = None):
    entry = LogEvent(
        time=datetime.now().strftime("%H:%M:%S"),
        level=level,  # type: ignore
        symbol=symbol,
        message=message,
    )
    state.logs.appendleft(entry)
    print(f"[{entry.time}] {level:5} {symbol or '---':25} {message}")


def _forex_session_active() -> bool:
    """Londres 07:00-16:00 GMT o NY 13:00-22:00 GMT (solapadas = mejor liquidez)."""
    hour = datetime.utcnow().hour
    return 7 <= hour < 22


def _should_scan(cfg: SymbolCfg) -> bool:
    if not cfg.enabled:
        return False
    if cfg.kind == "forex" and not _forex_session_active():
        return False
    return True


def _pick_filling_mode(symbol: str):
    """Devuelve el filling mode soportado por el símbolo, probando FOK → IOC → RETURN."""
    info = mt5.symbol_info(symbol)
    if info is None:
        return mt5.ORDER_FILLING_FOK
    mode = info.filling_mode
    if mode & 1:
        return mt5.ORDER_FILLING_FOK
    if mode & 2:
        return mt5.ORDER_FILLING_IOC
    return mt5.ORDER_FILLING_RETURN


def _send_order_with_fallback(request: dict, symbol: str):
    """Intenta FOK primero, si retorna 'Unsupported filling mode' prueba IOC y luego RETURN."""
    for filling in (_pick_filling_mode(symbol), mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_RETURN):
        request["type_filling"] = filling
        result = mt5.order_send(request)
        if result is None:
            return None
        if result.retcode != 10030:  # unsupported filling mode
            return result
    return result


def _execute_signal(sig: Signal) -> tuple[bool, str]:
    """Envía orden a MT5. Devuelve (ok, mensaje)."""
    info = mt5.symbol_info(sig.symbol)
    if info is None:
        return False, "symbol_info None"
    if not info.visible:
        mt5.symbol_select(sig.symbol, True)
        info = mt5.symbol_info(sig.symbol)

    account = mt5.account_info()
    if account is None:
        return False, "account_info None"

    equity = account.equity
    volume = risk.position_size(sig.symbol, sig.price, sig.sl, equity)
    if volume <= 0:
        return False, "volumen calculado = 0 (SL muy cerca o símbolo sin info)"

    can, reason = risk.can_trade(sig.symbol, equity, state.start_equity or equity)
    if not can:
        return False, f"bloqueado: {reason}"

    order_type = mt5.ORDER_TYPE_BUY if sig.side == "BUY" else mt5.ORDER_TYPE_SELL
    tick = mt5.symbol_info_tick(sig.symbol)
    price = tick.ask if sig.side == "BUY" else tick.bid

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": sig.symbol,
        "volume": volume,
        "type": order_type,
        "price": price,
        "sl": sig.sl,
        "tp": sig.tp,
        "deviation": 20,
        "magic": 20261234,
        "comment": "bottrading",
        "type_time": mt5.ORDER_TIME_GTC,
    }

    result = _send_order_with_fallback(request, sig.symbol)
    if result is None:
        return False, f"order_send None: {mt5.last_error()}"
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return False, f"retcode {result.retcode}: {result.comment}"

    return True, f"ticket {result.order} @ {result.price}, vol {volume}"


async def _scan_symbol(cfg: SymbolCfg):
    try:
        if not _should_scan(cfg):
            return

        sig = await asyncio.to_thread(evaluate, cfg.symbol, cfg.timeframe, _cfg_for(cfg.kind))
        if sig is None:
            return

        state.signals_total += 1
        record = SignalRecord(
            time=datetime.now().strftime("%H:%M:%S"),
            symbol=sig.symbol,
            side=sig.side,
            price=sig.price,
            sl=sig.sl,
            tp=sig.tp,
            rsi=sig.rsi,
            executed=False,
            reason=sig.reason,
        )

        _log("INFO", f"Señal {sig.side} detectada — {sig.reason}", sig.symbol)

        ok, msg = await asyncio.to_thread(_execute_signal, sig)
        record.executed = ok
        record.execution_note = msg

        if ok:
            state.trades_opened += 1
            _log("TRADE", f"OPEN {sig.side} @ {sig.price:.5f} SL {sig.sl:.5f} TP {sig.tp:.5f} — {msg}", sig.symbol)
        else:
            _log("WARN", f"Señal no ejecutada — {msg}", sig.symbol)

        state.signals.appendleft(record)
    except Exception as e:
        _log("ERROR", f"scan failed: {e}", cfg.symbol)


async def _scan_loop(interval: int = 30):
    _log("INFO", f"Bot iniciado — {len(state.symbols)} símbolos, intervalo {interval}s")
    state.running = True
    state.started_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    acc = mt5.account_info()
    if acc:
        state.start_equity = acc.equity

    try:
        while state.running:
            t0 = time.time()
            await asyncio.gather(*(_scan_symbol(c) for c in state.symbols))

            # gestión de posiciones abiertas: breakeven + trailing
            try:
                actions = await asyncio.to_thread(manage_positions, mgmt_cfg)
                for act in actions:
                    _log("TRADE",
                         f"{act['type'].upper()} ticket {act['ticket']} — {act['message']}",
                         act['symbol'])
            except Exception as e:
                _log("ERROR", f"position manager failed: {e}")

            # pre-shutdown guard (17:55): blindaje diario + cerrar forex el viernes
            try:
                if shutdown_guard.should_trigger_now(guard_cfg):
                    _log("INFO", f"Disparando shutdown guard (ventana {guard_cfg.trigger_hour}:{guard_cfg.trigger_minute:02d})")
                    summary = await asyncio.to_thread(shutdown_guard.run, guard_cfg, state.symbols, False)
                    closed = len(summary["actions"]["closed"])
                    be = len(summary["actions"]["breakeven"])
                    skipped = len(summary["actions"]["skipped"])
                    _log("TRADE", f"Guard aplicado — cerradas: {closed}, BE: {be}, omitidas: {skipped}")
                    for a in summary["actions"]["closed"]:
                        _log("TRADE", f"[viernes] CERRADA {a['symbol']} — {a['message']}", a['symbol'])
                    for a in summary["actions"]["breakeven"]:
                        _log("TRADE", f"[blindaje] BE {a['symbol']} — {a['message']}", a['symbol'])
            except Exception as e:
                _log("ERROR", f"shutdown guard failed: {e}")

            state.last_scan = datetime.now().strftime("%H:%M:%S")
            state.scans_total += 1

            elapsed = time.time() - t0
            sleep_for = max(0, interval - elapsed)
            await asyncio.sleep(sleep_for)
    except asyncio.CancelledError:
        pass
    finally:
        state.running = False
        _log("INFO", "Bot detenido")


async def start(interval: int = 30) -> bool:
    global _task
    if state.running:
        return False
    if not mt5_client.ensure_connected():
        _log("ERROR", "MT5 no conectado — no se puede iniciar bot")
        return False

    _task = asyncio.create_task(_scan_loop(interval))
    return True


def stop() -> bool:
    global _task
    if not state.running:
        return False
    state.running = False
    if _task:
        _task.cancel()
    return True


def get_status() -> dict:
    return {
        "running": state.running,
        "started_at": state.started_at,
        "last_scan": state.last_scan,
        "scans_total": state.scans_total,
        "signals_total": state.signals_total,
        "trades_opened": state.trades_opened,
        "start_equity": state.start_equity,
        "symbols": [asdict(s) for s in state.symbols],
        "risk_state": {
            "consecutive_losses": risk.state.consecutive_losses,
            "trades_today": risk.state.trades_today,
            "pnl_today": risk.state.pnl_today,
            "paused": risk.state.paused_until_reset,
            "pause_reason": risk.state.pause_reason,
        },
        "management": {
            "breakeven_at_pct": mgmt_cfg.breakeven_at_pct,
            "trailing_at_pct": mgmt_cfg.trailing_at_pct,
            "trailing_atr_mult": mgmt_cfg.trailing_atr_mult,
        },
        "guard": {
            "trigger_at": f"{guard_cfg.trigger_hour:02d}:{guard_cfg.trigger_minute:02d}",
            "no_gap_kinds": list(guard_cfg.no_gap_kinds),
            **shutdown_guard.get_state(),
        },
    }


def run_guard(force_close_all: bool = False) -> dict:
    """Ejecuta el shutdown guard manualmente."""
    summary = shutdown_guard.run(guard_cfg, state.symbols, force_close_all)
    _log("TRADE", f"Guard manual — closed={len(summary['actions']['closed'])} BE={len(summary['actions']['breakeven'])}")
    return summary


def get_logs(limit: int = 100) -> list[dict]:
    return [asdict(e) for e in list(state.logs)[:limit]]


def get_signals(limit: int = 50) -> list[dict]:
    return [asdict(s) for s in list(state.signals)[:limit]]


def analyze_symbols() -> list[dict]:
    """Estado actual de los indicadores por símbolo — útil para debug sin esperar al scan."""
    from strategy import load_bars, rsi as rsi_fn, ema as ema_fn, atr as atr_fn
    result = []
    for cfg in state.symbols:
        bars = load_bars(cfg.symbol, cfg.timeframe, 250)
        if bars is None or len(bars) < 200:
            result.append({
                "symbol": cfg.symbol,
                "kind": cfg.kind,
                "timeframe": cfg.timeframe,
                "error": "sin datos suficientes",
            })
            continue
        cfg_strat = _cfg_for(cfg.kind)
        bars["rsi"] = rsi_fn(bars["close"], cfg_strat.rsi_period)
        bars["ema"] = ema_fn(bars["close"], cfg_strat.ema_period)
        bars["atr"] = atr_fn(bars, cfg_strat.atr_period)
        prev = bars.iloc[-2]
        price = float(prev["close"])
        ema_v = float(prev["ema"])
        rsi_v = float(prev["rsi"])
        trend = "alcista" if price > ema_v else "bajista"
        zone = "sobrecompra" if rsi_v > cfg_strat.rsi_overbought else (
            "sobreventa" if rsi_v < cfg_strat.rsi_oversold else "neutral"
        )
        result.append({
            "symbol": cfg.symbol,
            "kind": cfg.kind,
            "timeframe": cfg.timeframe,
            "mode": cfg_strat.mode,
            "price": round(price, 5),
            "ema200": round(ema_v, 5),
            "rsi": round(rsi_v, 1),
            "atr": round(float(prev["atr"]), 5),
            "trend": trend,
            "zone": zone,
            "thresholds": {"oversold": cfg_strat.rsi_oversold, "overbought": cfg_strat.rsi_overbought},
        })
    return result


def test_trade(symbol: str = "Volatility 10 Index") -> dict:
    """Envía orden mínima de mercado para verificar que el pipeline de órdenes funciona."""
    if not mt5.symbol_select(symbol, True):
        return {"ok": False, "error": f"no se pudo seleccionar {symbol}"}

    info = mt5.symbol_info(symbol)
    tick = mt5.symbol_info_tick(symbol)
    if info is None or tick is None or tick.ask == 0:
        return {"ok": False, "error": "sin información de símbolo/tick"}

    req = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": info.volume_min,
        "type": mt5.ORDER_TYPE_BUY,
        "price": tick.ask,
        "deviation": 50,
        "magic": 20261234,
        "comment": "bottrading-test",
        "type_time": mt5.ORDER_TIME_GTC,
    }
    result = _send_order_with_fallback(req, symbol)
    if result is None:
        return {"ok": False, "error": f"order_send None: {mt5.last_error()}"}

    ok = result.retcode == mt5.TRADE_RETCODE_DONE
    _log("TRADE" if ok else "ERROR",
         f"TEST {symbol} vol={info.volume_min} retcode={result.retcode} — {result.comment}",
         symbol)
    return {
        "ok": ok,
        "retcode": result.retcode,
        "comment": result.comment,
        "order": result.order,
        "price": result.price,
        "volume": info.volume_min,
    }


def set_symbols(symbols: list[dict]) -> None:
    new = []
    for s in symbols:
        new.append(SymbolCfg(
            symbol=s["symbol"],
            kind=s.get("kind", "forex"),
            timeframe=s.get("timeframe", "H1"),
            enabled=s.get("enabled", True),
        ))
    state.symbols = new
    _log("INFO", f"Símbolos actualizados: {len(new)} configurados")
