"""Gestión de riesgo: position sizing, circuit breakers."""
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional
import MetaTrader5 as mt5


@dataclass
class RiskConfig:
    risk_per_trade_pct: float = 1.0      # % de equity arriesgado por trade
    max_positions: int = 5                # posiciones simultáneas totales
    max_positions_per_symbol: int = 1     # uno por símbolo
    max_daily_loss_pct: float = 3.0       # stop diario si pierde >3%
    max_drawdown_pct: float = 10.0        # pausa global si DD >10%
    max_consecutive_losses: int = 3       # pausa tras N pérdidas seguidas
    min_spread_ratio: float = 3.0         # si spread > 3x promedio, bloquea entrada


@dataclass
class RiskState:
    consecutive_losses: int = 0
    trades_today: int = 0
    pnl_today: float = 0.0
    last_reset: date = field(default_factory=date.today)
    paused_until_reset: bool = False
    pause_reason: Optional[str] = None


class RiskManager:
    def __init__(self, cfg: RiskConfig | None = None):
        self.cfg = cfg or RiskConfig()
        self.state = RiskState()

    def _reset_if_new_day(self):
        today = date.today()
        if today != self.state.last_reset:
            self.state = RiskState(
                consecutive_losses=self.state.consecutive_losses,
                last_reset=today,
            )

    def position_size(self, symbol: str, entry: float, sl: float, equity: float) -> float:
        """Calcula el lotaje para que la pérdida al SL sea risk_per_trade_pct de equity."""
        info = mt5.symbol_info(symbol)
        if info is None:
            return 0.0

        risk_amount = equity * (self.cfg.risk_per_trade_pct / 100)
        distance = abs(entry - sl)
        if distance <= 0:
            return 0.0

        # tick_value = valor monetario de 1 tick × 1 lote
        tick_value = info.trade_tick_value
        tick_size = info.trade_tick_size
        if tick_size <= 0:
            return 0.0

        loss_per_lot = (distance / tick_size) * tick_value
        if loss_per_lot <= 0:
            return 0.0

        raw_volume = risk_amount / loss_per_lot

        # ajustar a step y límites
        volume = max(info.volume_min, min(info.volume_max, raw_volume))
        step = info.volume_step
        if step > 0:
            volume = round(volume / step) * step
        return round(volume, 2)

    def can_trade(self, symbol: str, equity: float, start_equity: float) -> tuple[bool, str]:
        self._reset_if_new_day()

        if self.state.paused_until_reset:
            return False, f"Pausado: {self.state.pause_reason}"

        # circuit breakers
        if self.state.consecutive_losses >= self.cfg.max_consecutive_losses:
            self.state.paused_until_reset = True
            self.state.pause_reason = f"{self.state.consecutive_losses} pérdidas consecutivas"
            return False, self.state.pause_reason

        daily_loss_pct = (self.state.pnl_today / equity * 100) if equity > 0 else 0
        if daily_loss_pct <= -self.cfg.max_daily_loss_pct:
            self.state.paused_until_reset = True
            self.state.pause_reason = f"Pérdida diaria {daily_loss_pct:.2f}% excede límite"
            return False, self.state.pause_reason

        dd_pct = ((start_equity - equity) / start_equity * 100) if start_equity > 0 else 0
        if dd_pct >= self.cfg.max_drawdown_pct:
            self.state.paused_until_reset = True
            self.state.pause_reason = f"Drawdown {dd_pct:.2f}% excede límite"
            return False, self.state.pause_reason

        # verificar posiciones totales y por símbolo
        positions = mt5.positions_get() or []
        if len(positions) >= self.cfg.max_positions:
            return False, f"Máximo {self.cfg.max_positions} posiciones alcanzado"

        same_symbol = [p for p in positions if p.symbol == symbol]
        if len(same_symbol) >= self.cfg.max_positions_per_symbol:
            return False, f"Ya hay posición abierta en {symbol}"

        # verificar spread
        info = mt5.symbol_info(symbol)
        tick = mt5.symbol_info_tick(symbol)
        if info and tick:
            spread = (tick.ask - tick.bid) / info.point
            # asumimos spread "normal" si es < 5x del promedio del tipo (placeholder simple)
            # en producción, trackear spread histórico

        return True, "ok"

    def record_trade_result(self, pnl: float):
        """Llamado cuando una posición se cierra — actualiza estadísticas."""
        self._reset_if_new_day()
        self.state.trades_today += 1
        self.state.pnl_today += pnl
        if pnl < 0:
            self.state.consecutive_losses += 1
        else:
            self.state.consecutive_losses = 0

    def reset_pause(self):
        self.state.paused_until_reset = False
        self.state.pause_reason = None


risk = RiskManager()
