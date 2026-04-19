import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import clsx from 'clsx';
import { trades } from '../data/mockData';

const extendedTrades = [
  ...trades,
  { id: 't7', symbol: 'Boom 500', type: 'BUY' as const, volume: 0.5, entry: 12380, exit: 12420, pnl: 20, closedAt: 'Ayer 22:15', reason: 'TP' as const },
  { id: 't8', symbol: 'Volatility 75', type: 'SELL' as const, volume: 0.3, entry: 380100, exit: 378500, pnl: 48, closedAt: 'Ayer 18:40', reason: 'TP' as const },
  { id: 't9', symbol: 'EURUSD', type: 'BUY' as const, volume: 0.2, entry: 1.082, exit: 1.0805, pnl: -30, closedAt: 'Ayer 14:20', reason: 'SL' as const },
  { id: 't10', symbol: 'Crash 1000', type: 'SELL' as const, volume: 0.1, entry: 8600, exit: 8560, pnl: 40, closedAt: 'Ayer 11:08', reason: 'TRAILING' as const },
  { id: 't11', symbol: 'GBPUSD', type: 'BUY' as const, volume: 0.15, entry: 1.263, exit: 1.265, pnl: 30, closedAt: '2 días 16:45', reason: 'TP' as const },
  { id: 't12', symbol: 'Volatility 100', type: 'BUY' as const, volume: 0.4, entry: 1230, exit: 1218, pnl: -48, closedAt: '2 días 10:22', reason: 'SL' as const },
];

const reasonStyles = {
  TP: 'bg-accent-green/10 text-accent-green',
  SL: 'bg-accent-red/10 text-accent-red',
  TRAILING: 'bg-accent-blue/10 text-accent-blue',
  MANUAL: 'bg-slate-600/20 text-slate-400',
};

type Filter = 'all' | 'wins' | 'losses';

export function HistoryView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return extendedTrades.filter((t) => {
      if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === 'wins' && t.pnl < 0) return false;
      if (filter === 'losses' && t.pnl >= 0) return false;
      return true;
    });
  }, [search, filter]);

  const stats = useMemo(() => {
    const wins = filtered.filter((t) => t.pnl >= 0);
    const losses = filtered.filter((t) => t.pnl < 0);
    const totalPnl = filtered.reduce((a, t) => a + t.pnl, 0);
    return {
      total: filtered.length,
      wins: wins.length,
      losses: losses.length,
      winRate: filtered.length > 0 ? ((wins.length / filtered.length) * 100).toFixed(1) : '0',
      totalPnl,
    };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBox label="Total" value={stats.total.toString()} />
        <StatBox label="Ganadoras" value={stats.wins.toString()} accent="green" />
        <StatBox label="Perdedoras" value={stats.losses.toString()} accent="red" />
        <StatBox label="Win rate" value={`${stats.winRate}%`} />
        <StatBox
          label="P&L total"
          value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
          accent={stats.totalPnl >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="card">
        <div className="p-4 border-b border-bg-700 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por símbolo..."
              className="w-full bg-bg-700 border border-bg-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>
          <div className="flex gap-1 bg-bg-700 rounded-lg p-1">
            {(['all', 'wins', 'losses'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-md transition-colors',
                  filter === f ? 'bg-bg-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {f === 'all' ? 'Todas' : f === 'wins' ? 'Ganadoras' : 'Perdedoras'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-300 text-sm">
            <Download size={14} />
            CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-bg-700">
                <th className="px-5 py-3 font-medium">Símbolo</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Volumen</th>
                <th className="px-3 py-3 font-medium">Entrada</th>
                <th className="px-3 py-3 font-medium">Salida</th>
                <th className="px-3 py-3 font-medium">Motivo</th>
                <th className="px-3 py-3 font-medium">Cerrado</th>
                <th className="px-3 py-3 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-bg-700/50 hover:bg-bg-700/30">
                  <td className="px-5 py-3 text-white font-sans">{t.symbol}</td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded font-sans',
                        t.type === 'BUY' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
                      )}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{t.volume.toFixed(2)}</td>
                  <td className="px-3 py-3 text-slate-300">{t.entry}</td>
                  <td className="px-3 py-3 text-white">{t.exit}</td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded font-sans',
                        reasonStyles[t.reason]
                      )}
                    >
                      {t.reason}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{t.closedAt}</td>
                  <td
                    className={clsx(
                      'px-3 py-3 text-right font-semibold',
                      t.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                    )}
                  >
                    {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 text-sm">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'green' | 'red';
}) {
  const color =
    accent === 'green' ? 'text-accent-green' : accent === 'red' ? 'text-accent-red' : 'text-white';
  return (
    <div className="card p-4">
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className={clsx('font-semibold text-xl font-mono', color)}>{value}</div>
    </div>
  );
}
