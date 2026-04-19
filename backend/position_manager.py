"""Gestión de posiciones abiertas: breakeven + trailing stop.

Reglas (NO modifica la estrategia de entrada):

1. BREAKEVEN: cuando el precio alcanza 50% del recorrido hacia TP,
   mueve SL al precio de entrada (+ buffer mínimo). La posición ya no puede perder.

2. TRAILING: cuando el precio alcanza 80% del recorrido hacia TP,
   el SL sigue al precio a 1 ATR de distancia. Bloquea ganancia progresiva.

Se aplica solo a posiciones del bot (magic=20261234).
Se ejecuta cada ciclo del scan loop.
"""
from dataclasses import dataclass
from typing import Optional
import MetaTrader5 as mt5
import pandas as pd

from strategy import load_bars, atr as atr_fn

BOT_MAGIC = 20261234


@dataclass
class ManagementConfig:
    breakeven_at_pct: float = 0.50      # mueve SL a BE cuando price alcanza 50% de TP
    breakeven_buffer_pts: float = 0.0   # puntos extra sobre entry al hacer BE (spread buffer)
    trailing_at_pct: float = 0.80       # activa trailing al alcanzar 80% de TP
    trailing_atr_mult: float = 1.0      # distancia del trailing en ATRs
    trailing_timeframe: str = "M15"     # TF para calcular ATR del trailing


def _atr_for(symbol: str, timeframe: str, period: int = 14) -> Optional[float]:
    bars = load_bars(symbol, timeframe, period + 50)
    if bars is None or len(bars) < period + 2:
        return None
    a = atr_fn(bars, period)
    v = float(a.iloc[-2])
    return v if pd.notna(v) and v > 0 else None


def _modify_sl(position, new_sl: float, reason: str) -> tuple[bool, str]:
    """Envía TRADE_ACTION_SLTP para modificar solo el SL de la posición."""
    info = mt5.symbol_info(position.symbol)
    if info is None:
        return False, "symbol_info None"

    # redondear al dígito del símbolo
    new_sl = round(new_sl, info.digits)

    # validación: no retroceder el SL (solo mover a favor)
    if position.type == mt5.POSITION_TYPE_BUY:
        if position.sl > 0 and new_sl <= position.sl:
            return False, f"SL {new_sl} no mejora el actual {position.sl}"
    else:
        if position.sl > 0 and new_sl >= position.sl:
            return False, f"SL {new_sl} no mejora el actual {position.sl}"

    # distancia mínima (stops_level) — brokers a veces requieren mínimo separación
    tick = mt5.symbol_info_tick(position.symbol)
    if tick is not None and info.trade_stops_level > 0:
        min_dist = info.trade_stops_level * info.point
        cur_price = tick.bid if position.type == mt5.POSITION_TYPE_BUY else tick.ask
        if position.type == mt5.POSITION_TYPE_BUY and (cur_price - new_sl) < min_dist:
            return False, f"SL demasiado cerca del precio (min dist {min_dist:.5f})"
        if position.type == mt5.POSITION_TYPE_SELL and (new_sl - cur_price) < min_dist:
            return False, f"SL demasiado cerca del precio (min dist {min_dist:.5f})"

    request = {
        "action": mt5.TRADE_ACTION_SLTP,
        "position": position.ticket,
        "symbol": position.symbol,
        "sl": new_sl,
        "tp": position.tp,
        "magic": position.magic,
    }
    result = mt5.order_send(request)
    if result is None:
        return False, f"order_send None: {mt5.last_error()}"
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return False, f"retcode {result.retcode}: {result.comment}"
    return True, f"SL → {new_sl} ({reason})"


def manage(cfg: ManagementConfig = ManagementConfig()) -> list[dict]:
    """Revisa todas las posiciones del bot y aplica BE/trailing donde corresponda.

    Devuelve lista de acciones aplicadas (útil para logging).
    """
    actions = []
    positions = mt5.positions_get()
    if positions is None:
        return actions

    for p in positions:
        if p.magic != BOT_MAGIC:
            continue
        if p.tp == 0 or p.price_open == 0:
            continue  # sin TP definido, no podemos calcular progreso

        tick = mt5.symbol_info_tick(p.symbol)
        if tick is None:
            continue

        current = tick.bid if p.type == mt5.POSITION_TYPE_BUY else tick.ask
        entry = p.price_open
        tp = p.tp

        # calcular progreso hacia TP (0.0 = entry, 1.0 = TP)
        if p.type == mt5.POSITION_TYPE_BUY:
            total = tp - entry
            current_gain = current - entry
        else:
            total = entry - tp
            current_gain = entry - current

        if total <= 0:
            continue
        progress = current_gain / total

        # ---- TRAILING (mayor prioridad: sobreescribe BE si aplica) ----
        if progress >= cfg.trailing_at_pct:
            atr_val = _atr_for(p.symbol, cfg.trailing_timeframe)
            if atr_val:
                if p.type == mt5.POSITION_TYPE_BUY:
                    trailing_sl = current - atr_val * cfg.trailing_atr_mult
                else:
                    trailing_sl = current + atr_val * cfg.trailing_atr_mult
                ok, msg = _modify_sl(p, trailing_sl, f"trailing {progress*100:.0f}%")
                if ok:
                    actions.append({
                        "ticket": p.ticket, "symbol": p.symbol, "type": "trailing",
                        "progress": round(progress, 2), "new_sl": round(trailing_sl, 5),
                        "message": msg,
                    })
            continue

        # ---- BREAKEVEN ----
        if progress >= cfg.breakeven_at_pct:
            # solo si SL aún está del lado perdedor
            if p.type == mt5.POSITION_TYPE_BUY:
                if p.sl > 0 and p.sl >= entry:
                    continue  # ya está en BE o mejor
                new_sl = entry + cfg.breakeven_buffer_pts
            else:
                if p.sl > 0 and p.sl <= entry:
                    continue
                new_sl = entry - cfg.breakeven_buffer_pts

            ok, msg = _modify_sl(p, new_sl, f"breakeven {progress*100:.0f}%")
            if ok:
                actions.append({
                    "ticket": p.ticket, "symbol": p.symbol, "type": "breakeven",
                    "progress": round(progress, 2), "new_sl": round(new_sl, 5),
                    "message": msg,
                })

    return actions
