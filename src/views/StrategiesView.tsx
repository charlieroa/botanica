import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { strategies as initialStrategies, type Strategy } from '../data/mockData';

export function StrategiesView() {
  const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
  const [expanded, setExpanded] = useState<string | null>('s1');

  const toggle = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const active = strategies.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-slate-500 text-xs">Total estrategias</div>
            <div className="text-white font-semibold text-lg">{strategies.length}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">Activas</div>
            <div className="text-accent-green font-semibold text-lg">{active}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs">P&L combinado</div>
            <div className="text-accent-green font-semibold text-lg font-mono">
              +${strategies.reduce((a, s) => a + s.pnl, 0).toFixed(2)}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg text-sm hover:bg-accent-blue/20">
          <Plus size={16} />
          Nueva estrategia
        </button>
      </div>

      <div className="space-y-3">
        {strategies.map((s) => {
          const isExpanded = expanded === s.id;
          return (
            <div key={s.id} className="card">
              <div className="p-5 flex items-center gap-4">
                <button
                  onClick={() => toggle(s.id)}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0',
                    s.enabled ? 'bg-accent-green' : 'bg-bg-700'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
                      s.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold truncate">{s.name}</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-bg-700 text-slate-400">
                      {s.timeframe}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{s.description}</p>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm shrink-0">
                  <div className="text-center">
                    <div className="text-[11px] text-slate-500">Win rate</div>
                    <div className="text-white font-mono">{s.winRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] text-slate-500">Trades</div>
                    <div className="text-white font-mono">{s.trades}</div>
                  </div>
                  <div className="text-center min-w-20">
                    <div className="text-[11px] text-slate-500">P&L</div>
                    <div
                      className={clsx(
                        'font-mono font-semibold flex items-center gap-1 justify-center',
                        s.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                      )}
                    >
                      {s.pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : s.id)}
                  className="p-2 rounded-lg hover:bg-bg-700 text-slate-400"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-bg-700/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Parámetros</h4>
                    <div className="space-y-2">
                      {s.params.map((p) => (
                        <div key={p.label} className="flex justify-between text-sm">
                          <span className="text-slate-400">{p.label}</span>
                          <span className="text-white font-mono">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Símbolos</h4>
                    <div className="flex flex-wrap gap-2">
                      {s.symbols.map((sym) => (
                        <span
                          key={sym}
                          className="text-xs px-2.5 py-1 rounded-md bg-bg-700 text-slate-300"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-200">
                        Editar
                      </button>
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-200">
                        Duplicar
                      </button>
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20">
                        Backtest
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
