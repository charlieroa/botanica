export type Position = {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entry: number;
  current: number;
  sl: number;
  tp: number;
  pnl: number;
  openedAt: string;
};

export type Trade = {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entry: number;
  exit: number;
  pnl: number;
  closedAt: string;
  reason: 'TP' | 'SL' | 'MANUAL' | 'TRAILING';
};

export type LogEntry = {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'TRADE';
  message: string;
};

export const kpis = {
  balance: 10427.85,
  equity: 10512.3,
  pnlToday: 84.45,
  pnlTotal: 427.85,
  winRate: 62.5,
  maxDrawdown: 3.8,
  openPositions: 3,
  tradesToday: 8,
};

export const equityCurve = Array.from({ length: 30 }, (_, i) => {
  const base = 10000;
  const trend = i * 15;
  const noise = Math.sin(i * 0.7) * 80 + Math.random() * 40 - 20;
  return {
    day: `D${i + 1}`,
    equity: Math.round((base + trend + noise) * 100) / 100,
  };
});

export const positions: Position[] = [
  {
    id: '1',
    symbol: 'Volatility 75',
    type: 'BUY',
    volume: 0.5,
    entry: 382450.12,
    current: 382890.45,
    sl: 381500.0,
    tp: 384000.0,
    pnl: 22.02,
    openedAt: '14:23:10',
  },
  {
    id: '2',
    symbol: 'EURUSD',
    type: 'SELL',
    volume: 0.1,
    entry: 1.0842,
    current: 1.0828,
    sl: 1.087,
    tp: 1.08,
    pnl: 14.0,
    openedAt: '13:05:42',
  },
  {
    id: '3',
    symbol: 'Boom 500',
    type: 'BUY',
    volume: 1.0,
    entry: 12458.3,
    current: 12512.8,
    sl: 12420.0,
    tp: 12600.0,
    pnl: 48.43,
    openedAt: '12:48:55',
  },
];

export const trades: Trade[] = [
  { id: 't1', symbol: 'Volatility 75', type: 'BUY', volume: 0.5, entry: 381200, exit: 382100, pnl: 45.0, closedAt: '11:42', reason: 'TP' },
  { id: 't2', symbol: 'GBPUSD', type: 'SELL', volume: 0.2, entry: 1.2654, exit: 1.2632, pnl: 44.0, closedAt: '10:58', reason: 'TP' },
  { id: 't3', symbol: 'Crash 1000', type: 'SELL', volume: 0.1, entry: 8542.5, exit: 8512.0, pnl: 30.5, closedAt: '10:12', reason: 'TRAILING' },
  { id: 't4', symbol: 'EURUSD', type: 'BUY', volume: 0.1, entry: 1.0825, exit: 1.0815, pnl: -10.0, closedAt: '09:34', reason: 'SL' },
  { id: 't5', symbol: 'Volatility 100', type: 'BUY', volume: 0.3, entry: 1245.8, exit: 1258.4, pnl: 37.8, closedAt: '08:50', reason: 'TP' },
  { id: 't6', symbol: 'USDJPY', type: 'SELL', volume: 0.15, entry: 148.92, exit: 149.08, pnl: -24.0, closedAt: '08:15', reason: 'SL' },
];

export type Strategy = {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  symbols: string[];
  enabled: boolean;
  winRate: number;
  trades: number;
  pnl: number;
  params: { label: string; value: string }[];
};

export const strategies: Strategy[] = [
  {
    id: 's1',
    name: 'RSI + EMA200 + Price Action',
    description: 'Reversión a la media con filtro de tendencia y confirmación de vela',
    timeframe: 'H1',
    symbols: ['Volatility 75', 'EURUSD', 'Boom 500'],
    enabled: true,
    winRate: 62.5,
    trades: 48,
    pnl: 427.85,
    params: [
      { label: 'RSI period', value: '14' },
      { label: 'RSI oversold', value: '30' },
      { label: 'RSI overbought', value: '70' },
      { label: 'EMA trend', value: '200' },
      { label: 'Risk per trade', value: '1.0%' },
      { label: 'R:R ratio', value: '1:2' },
    ],
  },
  {
    id: 's2',
    name: 'Breakout London',
    description: 'Ruptura de rango asiático en apertura de Londres (07:00 GMT)',
    timeframe: 'M15',
    symbols: ['GBPUSD', 'EURUSD', 'GBPJPY'],
    enabled: false,
    winRate: 48.2,
    trades: 22,
    pnl: -35.2,
    params: [
      { label: 'Asian range', value: '22:00-07:00' },
      { label: 'Breakout buffer', value: '5 pips' },
      { label: 'SL', value: 'Bajo mínimo rango' },
      { label: 'TP', value: '1.5x rango' },
    ],
  },
  {
    id: 's3',
    name: 'MACD Cross Sintéticos',
    description: 'Cruce MACD con filtro ADX en índices sintéticos de Deriv',
    timeframe: 'M30',
    symbols: ['Volatility 100', 'Crash 1000', 'Boom 1000'],
    enabled: true,
    winRate: 58.0,
    trades: 31,
    pnl: 182.45,
    params: [
      { label: 'MACD fast', value: '12' },
      { label: 'MACD slow', value: '26' },
      { label: 'MACD signal', value: '9' },
      { label: 'ADX threshold', value: '>25' },
    ],
  },
  {
    id: 's4',
    name: 'Scalper Boom/Crash',
    description: 'Scalping en spikes con gestión agresiva',
    timeframe: 'M1',
    symbols: ['Boom 500', 'Crash 500'],
    enabled: false,
    winRate: 71.4,
    trades: 14,
    pnl: 62.3,
    params: [
      { label: 'Trigger', value: 'Spike contra tendencia' },
      { label: 'SL', value: '10 ticks' },
      { label: 'TP', value: '20 ticks' },
      { label: 'Max trades/day', value: '5' },
    ],
  },
];

export const backtestResult = {
  strategy: 'RSI + EMA200 + Price Action',
  symbol: 'Volatility 75',
  period: '2025-10-01 a 2026-04-15',
  initialBalance: 10000,
  finalBalance: 12847.5,
  totalReturn: 28.48,
  totalTrades: 187,
  winRate: 61.5,
  profitFactor: 1.78,
  sharpeRatio: 1.42,
  maxDrawdown: 8.3,
  avgWin: 42.15,
  avgLoss: -23.8,
  expectancy: 15.23,
  equity: Array.from({ length: 180 }, (_, i) => {
    const base = 10000;
    const trend = i * 16;
    const noise = Math.sin(i * 0.3) * 120 + Math.random() * 60 - 30;
    const dd = i > 90 && i < 110 ? -400 : 0;
    return { day: i + 1, equity: Math.round((base + trend + noise + dd) * 100) / 100 };
  }),
};

export const logs: LogEntry[] = [
  { id: 'l1', time: '14:23:10', level: 'TRADE', message: 'OPEN BUY Volatility 75 @ 382450.12, SL 381500, TP 384000' },
  { id: 'l2', time: '14:22:58', level: 'INFO', message: 'Signal confirmed: RSI(14)=28.4 + bullish engulfing on H1' },
  { id: 'l3', time: '14:22:45', level: 'INFO', message: 'Trend filter: price > EMA200 on H1 ✓' },
  { id: 'l4', time: '14:15:00', level: 'INFO', message: 'Scanning 6 symbols across 3 timeframes' },
  { id: 'l5', time: '13:42:01', level: 'TRADE', message: 'CLOSE Volatility 75 @ 382100 (TP hit), +$45.00' },
  { id: 'l6', time: '13:05:42', level: 'TRADE', message: 'OPEN SELL EURUSD @ 1.0842, SL 1.0870, TP 1.0800' },
  { id: 'l7', time: '12:48:55', level: 'TRADE', message: 'OPEN BUY Boom 500 @ 12458.3' },
  { id: 'l8', time: '12:30:12', level: 'WARN', message: 'Spread elevado en GBPUSD (3.2 pips) — operación bloqueada' },
  { id: 'l9', time: '11:42:08', level: 'TRADE', message: 'CLOSE Volatility 75 @ 382100 (TP), +$45.00' },
  { id: 'l10', time: '09:34:22', level: 'TRADE', message: 'CLOSE EURUSD @ 1.0815 (SL), -$10.00' },
  { id: 'l11', time: '09:00:00', level: 'INFO', message: 'Bot iniciado — estrategia: RSI + EMA200 + Price Action' },
];
