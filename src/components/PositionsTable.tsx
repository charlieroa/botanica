import { X } from 'lucide-react';
import clsx from 'clsx';
import { positions as mockPositions } from '../data/mockData';
import type { ApiPosition } from '../api/client';

type Props = {
  positions?: ApiPosition[];
};

export function PositionsTable({ positions }: Props) {
  const rows = positions && positions.length > 0 ? positions : mockPositions.map((p) => ({
    id: parseInt(p.id),
    symbol: p.symbol,
    type: p.type,
    volume: p.volume,
    entry: p.entry,
    current: p.current,
    sl: p.sl,
    tp: p.tp,
    pnl: p.pnl,
    swap: 0,
    commission: 0,
    openedAt: p.openedAt,
    comment: '',
  } as ApiPosition));

  const isReal = !!positions && positions.length > 0;
  const isEmpty = !!positions && positions.length === 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between p-5 border-b border-bg-700">
        <div>
          <h3 className="text-white font-semibold">Posiciones abiertas</h3>
          <div className="text-xs text-slate-500">
            {isEmpty ? 'Sin posiciones abiertas en MT5' : `${rows.length} ${isReal ? 'activas (real)' : 'demo'}`}
          </div>
        </div>
        {rows.length > 0 && (
          <button className="text-xs text-slate-400 hover:text-white">Cerrar todas</button>
        )}
      </div>

      {isEmpty ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Tu cuenta no tiene posiciones abiertas
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-bg-700">
                <th className="px-5 py-3 font-medium">Símbolo</th>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Volumen</th>
                <th className="px-3 py-3 font-medium">Entrada</th>
                <th className="px-3 py-3 font-medium">Actual</th>
                <th className="px-3 py-3 font-medium">SL / TP</th>
                <th className="px-3 py-3 font-medium text-right">P&L</th>
                <th className="px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-bg-700/50 hover:bg-bg-700/30">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-white font-sans">{p.symbol}</div>
                    <div className="text-[11px] text-slate-500 font-sans">{p.openedAt}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={clsx(
                        'text-[11px] font-semibold px-2 py-0.5 rounded',
                        p.type === 'BUY'
                          ? 'bg-accent-green/10 text-accent-green'
                          : 'bg-accent-red/10 text-accent-red'
                      )}
                    >
                      {p.type}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-slate-300">{p.volume.toFixed(2)}</td>
                  <td className="px-3 py-3.5 text-slate-300">{p.entry.toFixed(p.entry < 10 ? 4 : 2)}</td>
                  <td className="px-3 py-3.5 text-white">{p.current.toFixed(p.current < 10 ? 4 : 2)}</td>
                  <td className="px-3 py-3.5 text-[11px] leading-tight">
                    <div className="text-accent-red/80">{p.sl ? p.sl.toFixed(p.sl < 10 ? 4 : 2) : '—'}</div>
                    <div className="text-accent-green/80">{p.tp ? p.tp.toFixed(p.tp < 10 ? 4 : 2) : '—'}</div>
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-3.5 text-right font-semibold',
                      p.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                    )}
                  >
                    {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                  </td>
                  <td className="px-3 py-3.5 pr-5">
                    <button className="p-1.5 rounded text-slate-500 hover:text-accent-red hover:bg-accent-red/10">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
