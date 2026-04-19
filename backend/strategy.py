"""Estrategia RSI + EMA200 + Price Action.

Reglas:
- Solo LONG si precio > EMA200 (tendencia alcista)
- Solo SHORT si precio < EMA200 (tendencia bajista)
- Entrada LONG: RSI sale de sobreventa (<30 → >30) + vela alcista (close > open)
- Entrada SHORT: RSI sale de sobrecompra (>70 → <70) + vela bajista (close < open)

Devuelve un Signal o None.
"""
from dataclasses import dataclass
from typing import Literal, Optional
import pandas as pd
import numpy as np
import MetaTrader5 as mt5


Side = Literal["BUY", "SELL"]


@dataclass
class Signal:
    symbol: str
    side: Side
    price: float
    sl: float
    tp: float
    reason: str
    rsi: float
    ema200: float
    timeframe: str


@dataclass
class StrategyConfig:
    rsi_period: int = 14
    rsi_oversold: float = 30.0
    rsi_overbought: float = 70.0
    ema_period: int = 200
    atr_period: int = 14
    sl_atr_mult: float = 1.5
    rr_ratio: float = 2.0
    min_bars: int = 250
    mode: str = "conservative"  # "conservative" o "reactive"


# presets por tipo de activo
PRESET_FOREX = StrategyConfig(mode="conservative", rsi_oversold=30, rsi_overbought=70)
PRESET_SYNTHETIC = StrategyConfig(mode="reactive", rsi_oversold=40, rsi_overbought=60, sl_atr_mult=2.0)
PRESET_METAL = StrategyConfig(mode="conservative", rsi_oversold=30, rsi_overbought=70)


TF_MAP = {
    "M1": mt5.TIMEFRAME_M1,
    "M5": mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1,
    "H4": mt5.TIMEFRAME_H4,
    "D1": mt5.TIMEFRAME_D1,
}


def rsi(closes: pd.Series, period: int) -> pd.Series:
    delta = closes.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def ema(closes: pd.Series, period: int) -> pd.Series:
    return closes.ewm(span=period, adjust=False).mean()


def atr(df: pd.DataFrame, period: int) -> pd.Series:
    high_low = df["high"] - df["low"]
    high_close = (df["high"] - df["close"].shift()).abs()
    low_close = (df["low"] - df["close"].shift()).abs()
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return tr.rolling(period).mean()


def load_bars(symbol: str, timeframe: str, count: int = 300) -> Optional[pd.DataFrame]:
    tf = TF_MAP.get(timeframe)
    if tf is None:
        return None
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
    if rates is None or len(rates) == 0:
        return None
    df = pd.DataFrame(rates)
    df["time"] = pd.to_datetime(df["time"], unit="s")
    return df


def evaluate(symbol: str, timeframe: str, cfg: StrategyConfig = StrategyConfig()) -> Optional[Signal]:
    df = load_bars(symbol, timeframe, cfg.min_bars)
    if df is None or len(df) < cfg.min_bars:
        return None

    df["rsi"] = rsi(df["close"], cfg.rsi_period)
    df["ema"] = ema(df["close"], cfg.ema_period)
    df["atr"] = atr(df, cfg.atr_period)

    # usamos la vela anterior (cerrada) para evitar entradas sobre vela incompleta
    prev = df.iloc[-2]
    prev2 = df.iloc[-3]

    rsi_now = prev["rsi"]
    rsi_prev = prev2["rsi"]
    ema_now = prev["ema"]
    price = prev["close"]
    atr_now = prev["atr"]
    bull_candle = prev["close"] > prev["open"]
    bear_candle = prev["close"] < prev["open"]

    if any(pd.isna(v) for v in [rsi_now, rsi_prev, ema_now, atr_now]):
        return None

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return None

    # modo reactivo: no requiere cruce estricto, basta con estar en zona extrema y vela de reversión
    if cfg.mode == "reactive":
        # LONG: tendencia alcista, RSI bajo umbral, vela alcista
        if price > ema_now and rsi_now < cfg.rsi_oversold and bull_candle:
            entry = tick.ask
            sl = entry - atr_now * cfg.sl_atr_mult
            tp = entry + (entry - sl) * cfg.rr_ratio
            return Signal(
                symbol=symbol, side="BUY", price=entry, sl=sl, tp=tp,
                reason=f"[reactive] RSI {rsi_now:.1f} < {cfg.rsi_oversold} + tendencia alcista + vela alcista",
                rsi=rsi_now, ema200=ema_now, timeframe=timeframe,
            )
        # SHORT: tendencia bajista, RSI sobre umbral, vela bajista
        if price < ema_now and rsi_now > cfg.rsi_overbought and bear_candle:
            entry = tick.bid
            sl = entry + atr_now * cfg.sl_atr_mult
            tp = entry - (sl - entry) * cfg.rr_ratio
            return Signal(
                symbol=symbol, side="SELL", price=entry, sl=sl, tp=tp,
                reason=f"[reactive] RSI {rsi_now:.1f} > {cfg.rsi_overbought} + tendencia bajista + vela bajista",
                rsi=rsi_now, ema200=ema_now, timeframe=timeframe,
            )
        return None

    # modo conservador (cruce estricto)
    # LONG: precio sobre EMA200, RSI cruzó arriba de 30, vela alcista
    if price > ema_now and rsi_prev < cfg.rsi_oversold <= rsi_now and bull_candle:
        entry = tick.ask
        sl = entry - atr_now * cfg.sl_atr_mult
        tp = entry + (entry - sl) * cfg.rr_ratio
        return Signal(
            symbol=symbol,
            side="BUY",
            price=entry,
            sl=sl,
            tp=tp,
            reason=f"RSI cruce alcista ({rsi_prev:.1f}→{rsi_now:.1f}) + tendencia alcista + vela alcista",
            rsi=rsi_now,
            ema200=ema_now,
            timeframe=timeframe,
        )

    # SHORT: precio bajo EMA200, RSI cruzó abajo de 70, vela bajista
    if price < ema_now and rsi_prev > cfg.rsi_overbought >= rsi_now and bear_candle:
        entry = tick.bid
        sl = entry + atr_now * cfg.sl_atr_mult
        tp = entry - (sl - entry) * cfg.rr_ratio
        return Signal(
            symbol=symbol,
            side="SELL",
            price=entry,
            sl=sl,
            tp=tp,
            reason=f"RSI cruce bajista ({rsi_prev:.1f}→{rsi_now:.1f}) + tendencia bajista + vela bajista",
            rsi=rsi_now,
            ema200=ema_now,
            timeframe=timeframe,
        )

    return None
