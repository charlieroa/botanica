const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export type ApiAccount = {
  login: number;
  name: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  margin: number;
  margin_free: number;
  margin_level: number;
  profit: number;
  company: string;
};

export type ApiPosition = {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entry: number;
  current: number;
  sl: number;
  tp: number;
  pnl: number;
  swap: number;
  commission: number;
  openedAt: string;
  comment: string;
};

export type ApiTrade = {
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

export type ApiStatus = {
  connected: boolean;
  server: string;
  login: number;
  error: string | null;
  terminal_build: number | null;
  terminal_connected: boolean;
  trade_allowed: boolean;
  terminal_path: string | null;
};

export type ApiSummary = {
  account: ApiAccount;
  kpis: {
    balance: number;
    equity: number;
    pnlToday: number;
    pnlTotal: number;
    winRate: number;
    openPositions: number;
    tradesTotal: number;
  };
  positions: ApiPosition[];
  recentTrades: ApiTrade[];
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export type BotSymbol = {
  symbol: string;
  kind: 'forex' | 'synthetic' | 'metal' | 'crypto';
  timeframe: string;
  enabled: boolean;
};

export type BotStatus = {
  running: boolean;
  started_at: string | null;
  last_scan: string | null;
  scans_total: number;
  signals_total: number;
  trades_opened: number;
  start_equity: number;
  symbols: BotSymbol[];
  risk_state: {
    consecutive_losses: number;
    trades_today: number;
    pnl_today: number;
    paused: boolean;
    pause_reason: string | null;
  };
  management?: {
    breakeven_at_pct: number;
    trailing_at_pct: number;
    trailing_atr_mult: number;
  };
  guard?: {
    trigger_at: string;
    no_gap_kinds: string[];
    last_run_date: string | null;
    last_run_time: string | null;
    last_actions: unknown;
  };
};

export type BotLog = {
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'TRADE';
  symbol: string | null;
  message: string;
};

export type BotSignal = {
  time: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  sl: number;
  tp: number;
  rsi: number;
  executed: boolean;
  reason: string;
  execution_note: string | null;
};

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  status: () => get<ApiStatus>('/api/status'),
  account: () => get<ApiAccount>('/api/account'),
  positions: () => get<ApiPosition[]>('/api/positions'),
  history: (days = 30) => get<ApiTrade[]>(`/api/history?days=${days}`),
  summary: () => get<ApiSummary>('/api/summary'),
  botStatus: () => get<BotStatus>('/api/bot/status'),
  botLogs: (limit = 50) => get<BotLog[]>(`/api/bot/logs?limit=${limit}`),
  botSignals: (limit = 30) => get<BotSignal[]>(`/api/bot/signals?limit=${limit}`),
  botStart: (interval = 30) => post<{ ok: boolean; status: BotStatus }>('/api/bot/start', { interval }),
  botStop: () => post<{ ok: boolean; status: BotStatus }>('/api/bot/stop'),
  botAnalysis: () => get<BotAnalysis[]>('/api/bot/analysis'),
  botTestTrade: (symbol = 'Volatility 75 Index') =>
    post<{
      ok: boolean;
      retcode?: number;
      comment?: string;
      order?: number;
      price?: number;
      volume?: number;
      error?: string;
    }>('/api/bot/test-trade', { symbol }),
  reconnect: () => post<ApiStatus>('/api/reconnect'),
};

export type BotAnalysis = {
  symbol: string;
  kind: 'forex' | 'synthetic' | 'metal' | 'crypto';
  timeframe: string;
  mode?: string;
  price?: number;
  ema200?: number;
  rsi?: number;
  atr?: number;
  trend?: 'alcista' | 'bajista';
  zone?: 'sobrecompra' | 'sobreventa' | 'neutral';
  thresholds?: { oversold: number; overbought: number };
  error?: string;
};
