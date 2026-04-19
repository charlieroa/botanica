import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { strategies, backtestResult } from '../data/mockData';

export function BacktestingView() {
  const [running, setRunning] = useState(false);
  const [hasResult, setHasResult] = useState(true);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setHasResult(true);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-white font-semibold mb-4">Configuración</h3>
          <div className="space-y-4">
            <Field label="Estrategia">
              <select className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white">
                {strategies.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Símbolo">
              <select className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white">
                <option>Volatility 75</option>
                <option>EURUSD</option>
                <option>GBPUSD</option>
                <option>Boom 500</option>
              </select>
            </Field>
            <Field label="Timeframe">
              <div className="grid grid-cols-5 gap-1">
                {['M5', 'M15', 'M30', 'H1', 'H4'].map((tf, i) => (
                  <button
                    key={tf}
                    className={clsx(
                      'py-1.5 text-xs rounded-md',
                      i === 3 ? 'bg-bg-600 text-white' : 'bg-bg-700 text-slate-400 hover:text-white'
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde">
                <input
                  type="date"
                  defaultValue="2025-10-01"
                  className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white"
                />
              </Field>
              <Field label="Hasta">
                <input
                  type="date"
                  defaultValue="2026-04-15"
                  className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white"
                />
              </Field>
            </div>
            <Field label="Balance inicial">
              <input
                type="number"
                defaultValue={10000}
                className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white font-mono"
              />
            </Field>
            <button
              onClick={run}
              disabled={running}
              className="w-full py-2.5 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {running ? 'Ejecutando...' : 'Ejecutar backtest'}
            </button>
          </div>
        </div>

        {hasResult && (
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">Curva de capital</h3>
                <div className="text-xs text-slate-500">
                  {backtestResult.strategy} · {backtestResult.symbol} · {backtestResult.period}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Retorno</div>
                <div className="text-accent-green font-mono font-semibold text-lg">
                  +{backtestResult.totalReturn}%
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestResult.equity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="btGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2030" />
                  <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#11161f', border: '1px solid #232a3d', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} fill="url(#btGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {hasResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Metric label="Balance final" value={`$${backtestResult.finalBalance.toFixed(0)}`} accent="green" />
          <Metric label="Operaciones" value={backtestResult.totalTrades.toString()} />
          <Metric label="Win rate" value={`${backtestResult.winRate}%`} />
          <Metric label="Profit factor" value={backtestResult.profitFactor.toFixed(2)} accent="green" />
          <Metric label="Sharpe" value={backtestResult.sharpeRatio.toFixed(2)} />
          <Metric label="Max DD" value={`${backtestResult.maxDrawdown}%`} accent="amber" />
          <Metric label="Ganancia media" value={`$${backtestResult.avgWin.toFixed(2)}`} accent="green" />
          <Metric label="Pérdida media" value={`$${backtestResult.avgLoss.toFixed(2)}`} accent="red" />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' | 'amber' }) {
  const accentClass =
    accent === 'green' ? 'text-accent-green' :
    accent === 'red' ? 'text-accent-red' :
    accent === 'amber' ? 'text-accent-amber' : 'text-white';
  return (
    <div className="card p-4">
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className={clsx('font-mono font-semibold text-lg', accentClass)}>{value}</div>
    </div>
  );
}
