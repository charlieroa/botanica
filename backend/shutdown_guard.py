"""Pre-shutdown guard: protege posiciones antes de apagar el PC.

Regla aplicada:
- Lunes a jueves 17:55 → BLINDAJE: mueve SL a breakeven en TODAS las posiciones del bot
- Viernes 17:55         → CERRAR forex + metal (evita gap de weekend) + BLINDAJE sintéticos

Cuando el bot está corriendo, el scan loop chequea la hora cada ciclo y dispara el guard
la primera vez que cruce el umbral del día. El estado se guarda en memoria y se reinicia
al cambiar de día.

También disponible como endpoint manual:  POST /api/bot/pre-shutdown
"""
from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional
import MetaTrader5 as mt5

BOT_MAGIC = 20261234


@dataclass
class GuardConfig:
    trigger_hour: int = 17
    trigger_minute: int = 55
    # sintéticos y cripto no tienen gap de weekend
    no_gap_kinds: tuple = ("synthetic", "crypto")


@dataclass
class GuardState:
    last_run_date: Optional[date] = None
    last_run_time: Optional[str] = None
    last_actions: list = None


state = GuardState(last_actions=[])


def _close_position(position) -> tuple[bool, str]:
    """Cierra una posición abierta enviando la operación opuesta."""
    tick = mt5.symbol_info_tick(position.symbol)
    if tick is None:
        return False, "sin tick"

    close_type = mt5.ORDER_TYPE_SELL if position.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = tick.bid if position.type == mt5.POSITION_TYPE_BUY else tick.ask

    info = mt5.symbol_info(position.symbol)
    filling_mode = info.filling_mode if info else 1
    # probar FOK, IOC, RETURN
    fillings = []
    if filling_mode & 1: fillings.append(mt5.ORDER_FILLING_FOK)
    if filling_mode & 2: fillings.append(mt5.ORDER_FILLING_IOC)
    fillings.append(mt5.ORDER_FILLING_RETURN)

    for fill in fillings + [mt5.ORDER_FILLING_FOK, mt5.ORDER_FILLING_IOC, mt5.ORDER_FILLING_RETURN]:
        req = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": position.ticket,
            "symbol": position.symbol,
            "volume": position.volume,
            "type": close_type,
            "price": price,
            "deviation": 30,
            "magic": position.magic,
            "comment": "shutdown-close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": fill,
        }
        result = mt5.order_send(req)
        if result is None:
            continue
        if result.retcode == mt5.TRADE_RETCODE_DONE:
            return True, f"cerrada @ {result.price}"
        if result.retcode != 10030:  # si no es "unsupported filling" no reintentamos
            return False, f"retcode {result.retcode}: {result.comment}"
    return False, "todos los filling modes fallaron"


def _move_sl_to_breakeven(position, buffer_pts: float = 0.0) -> tuple[bool, str]:
    """Mueve SL al precio de entrada si el trade está en verde."""
    info = mt5.symbol_info(position.symbol)
    tick = mt5.symbol_info_tick(position.symbol)
    if info is None or tick is None:
        return False, "sin info/tick"

    current = tick.bid if position.type == mt5.POSITION_TYPE_BUY else tick.ask

    # solo aplicamos BE si la posición está en verde (current favorable vs entry)
    if position.type == mt5.POSITION_TYPE_BUY:
        if current <= position.price_open:
            return False, f"en rojo ({current} <= {position.price_open}), no aplica BE"
        new_sl = round(position.price_open + buffer_pts, info.digits)
        if position.sl > 0 and position.sl >= new_sl:
            return False, "SL ya está en BE o mejor"
    else:
        if current >= position.price_open:
            return False, f"en rojo ({current} >= {position.price_open}), no aplica BE"
        new_sl = round(position.price_open - buffer_pts, info.digits)
        if position.sl > 0 and position.sl <= new_sl:
            return False, "SL ya está en BE o mejor"

    req = {
        "action": mt5.TRADE_ACTION_SLTP,
        "position": position.ticket,
        "symbol": position.symbol,
        "sl": new_sl,
        "tp": position.tp,
        "magic": position.magic,
    }
    result = mt5.order_send(req)
    if result is None:
        return False, f"order_send None: {mt5.last_error()}"
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return False, f"retcode {result.retcode}: {result.comment}"
    return True, f"SL → {new_sl} (breakeven)"


def _kind_of(symbol: str, symbols_cfg) -> str:
    """Busca el 'kind' del símbolo en la config del bot. Fallback 'forex'."""
    for s in symbols_cfg:
        if s.symbol == symbol:
            return s.kind
    return "forex"


def run(cfg: GuardConfig, symbols_cfg, force_close_all: bool = False) -> dict:
    """Ejecuta el guard. Devuelve resumen de acciones."""
    positions = mt5.positions_get() or []
    bot_positions = [p for p in positions if p.magic == BOT_MAGIC]

    today = date.today()
    is_friday = today.weekday() == 4  # 0=lun..4=vie

    actions = {"closed": [], "breakeven": [], "skipped": []}

    for p in bot_positions:
        kind = _kind_of(p.symbol, symbols_cfg)
        has_gap_risk = kind not in cfg.no_gap_kinds

        # viernes → cierra activos con gap (forex, metal, cripto-no-24/7)
        # o si force_close_all (endpoint manual con param)
        if force_close_all or (is_friday and has_gap_risk):
            ok, msg = _close_position(p)
            record = {"ticket": p.ticket, "symbol": p.symbol, "kind": kind, "message": msg}
            if ok:
                actions["closed"].append(record)
            else:
                actions["skipped"].append(record)
            continue

        # resto de días o sintéticos el viernes → blindaje BE
        ok, msg = _move_sl_to_breakeven(p)
        record = {"ticket": p.ticket, "symbol": p.symbol, "kind": kind, "message": msg}
        if ok:
            actions["breakeven"].append(record)
        else:
            actions["skipped"].append(record)

    state.last_run_date = today
    state.last_run_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    state.last_actions = actions

    return {
        "ran_at": state.last_run_time,
        "is_friday": is_friday,
        "force_close_all": force_close_all,
        "positions_processed": len(bot_positions),
        "actions": actions,
    }


def should_trigger_now(cfg: GuardConfig) -> bool:
    """True si entramos en la ventana 17:55-18:00 y aún no se corrió hoy."""
    now = datetime.now()
    today = now.date()

    if state.last_run_date == today:
        return False  # ya se ejecutó hoy

    if now.hour != cfg.trigger_hour:
        return False
    if now.minute < cfg.trigger_minute:
        return False

    return True


def get_state() -> dict:
    return {
        "last_run_date": str(state.last_run_date) if state.last_run_date else None,
        "last_run_time": state.last_run_time,
        "last_actions": state.last_actions,
    }
