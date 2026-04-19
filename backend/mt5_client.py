"""MT5 client wrapper — conexión, lectura de cuenta, posiciones, historial."""
import os
from datetime import datetime, timedelta
from typing import Optional
import MetaTrader5 as mt5
from dotenv import load_dotenv

load_dotenv()


class MT5Client:
    def __init__(self):
        self.login = int(os.getenv("MT5_LOGIN", "0"))
        self.password = os.getenv("MT5_PASSWORD", "")
        self.server = os.getenv("MT5_SERVER", "")
        self.path = os.getenv("MT5_PATH") or None
        self.connected = False
        self.last_error: Optional[str] = None

    def connect(self) -> bool:
        kwargs = {"login": self.login, "password": self.password, "server": self.server}
        if self.path:
            kwargs["path"] = self.path

        if not mt5.initialize(**kwargs):
            err = mt5.last_error()
            self.last_error = f"initialize failed: {err}"
            self.connected = False
            return False

        info = mt5.account_info()
        if info is None:
            self.last_error = f"account_info None: {mt5.last_error()}"
            mt5.shutdown()
            self.connected = False
            return False

        self.connected = True
        self.last_error = None
        return True

    def disconnect(self):
        mt5.shutdown()
        self.connected = False

    def ensure_connected(self) -> bool:
        if not self.connected:
            return self.connect()
        info = mt5.account_info()
        if info is None:
            return self.connect()
        return True

    def account(self) -> dict:
        if not self.ensure_connected():
            return {"error": self.last_error}
        info = mt5.account_info()
        if info is None:
            return {"error": "account_info None"}
        return {
            "login": info.login,
            "name": info.name,
            "server": info.server,
            "currency": info.currency,
            "leverage": info.leverage,
            "balance": info.balance,
            "equity": info.equity,
            "margin": info.margin,
            "margin_free": info.margin_free,
            "margin_level": info.margin_level,
            "profit": info.profit,
            "company": info.company,
        }

    def positions(self) -> list[dict]:
        if not self.ensure_connected():
            return []
        pos = mt5.positions_get()
        if pos is None:
            return []
        result = []
        for p in pos:
            symbol_info = mt5.symbol_info_tick(p.symbol)
            current = symbol_info.bid if p.type == mt5.POSITION_TYPE_SELL else symbol_info.ask if symbol_info else p.price_current
            result.append({
                "id": p.ticket,
                "symbol": p.symbol,
                "type": "BUY" if p.type == mt5.POSITION_TYPE_BUY else "SELL",
                "volume": p.volume,
                "entry": p.price_open,
                "current": current or p.price_current,
                "sl": p.sl,
                "tp": p.tp,
                "pnl": p.profit,
                "swap": p.swap,
                "commission": getattr(p, "commission", 0.0),
                "openedAt": datetime.fromtimestamp(p.time).strftime("%Y-%m-%d %H:%M:%S"),
                "comment": p.comment,
            })
        return result

    def history(self, days: int = 30) -> list[dict]:
        if not self.ensure_connected():
            return []
        to = datetime.now()
        frm = to - timedelta(days=days)
        deals = mt5.history_deals_get(frm, to)
        if deals is None:
            return []

        # agrupar deals por posición para construir trades completos
        positions: dict[int, list] = {}
        for d in deals:
            if d.position_id == 0:
                continue
            positions.setdefault(d.position_id, []).append(d)

        trades = []
        for pid, ds in positions.items():
            ds_sorted = sorted(ds, key=lambda x: x.time)
            if len(ds_sorted) < 2:
                continue
            entry = ds_sorted[0]
            exit_ = ds_sorted[-1]
            pnl = sum(d.profit + d.swap + d.commission for d in ds_sorted)
            reason = "TP" if pnl > 0 else "SL" if pnl < 0 else "MANUAL"
            trades.append({
                "id": str(pid),
                "symbol": entry.symbol,
                "type": "BUY" if entry.type == mt5.DEAL_TYPE_BUY else "SELL",
                "volume": entry.volume,
                "entry": entry.price,
                "exit": exit_.price,
                "pnl": round(pnl, 2),
                "closedAt": datetime.fromtimestamp(exit_.time).strftime("%Y-%m-%d %H:%M"),
                "reason": reason,
            })
        trades.sort(key=lambda t: t["closedAt"], reverse=True)
        return trades

    def symbols(self, search: str | None = None, limit: int = 500) -> list[dict]:
        if not self.ensure_connected():
            return []
        syms = mt5.symbols_get()
        if syms is None:
            return []
        result = []
        q = search.lower() if search else None
        for s in syms:
            if q and q not in s.name.lower() and q not in s.description.lower():
                continue
            result.append({
                "name": s.name,
                "description": s.description,
                "digits": s.digits,
                "spread": s.spread,
                "visible": s.visible,
                "path": getattr(s, "path", ""),
            })
            if len(result) >= limit:
                break
        return result

    def status(self) -> dict:
        ok = self.ensure_connected()
        terminal = mt5.terminal_info() if ok else None
        return {
            "connected": ok,
            "server": self.server,
            "login": self.login,
            "error": self.last_error,
            "terminal_build": terminal.build if terminal else None,
            "terminal_connected": terminal.connected if terminal else False,
            "trade_allowed": terminal.trade_allowed if terminal else False,
            "terminal_path": terminal.path if terminal else None,
        }

    def reconnect(self) -> dict:
        """Fuerza desconexión e inicialización limpia — útil tras cambiar ajustes del terminal."""
        try:
            mt5.shutdown()
        except Exception:
            pass
        self.connected = False
        ok = self.connect()
        return self.status()


client = MT5Client()
