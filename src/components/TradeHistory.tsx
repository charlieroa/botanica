import clsx from 'clsx';
import { trades as mockTrades } from '../data/mockData';
import type { ApiTrade } from '../api/client';

const reasonStyles = {
  TP: 'bg-accent-green/10 text-accent-green',
  SL: 'bg-accent-red/10 text-accent-red',
  TRAILING: 'bg-accent-blue/10 text-accent-blue',
  MANUAL: 'bg-slate-600/20 text-slate-400',
};

type Props = {
  trades?: ApiTrade[];
};

export function TradeHistory({ trades }: Props) {
  const rows = trades && trades.length > 0 ? trades : mockTrades;
  const isEmpty = !!trades && trades.length === 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between p-5 border-b border-bg-700">
        <div>
          <h3 className="text-white font-semibold">Historial reciente</h3>
          <div className="text-xs text-slate-500">
            {isEmpty ? 'Sin operaciones en los últimos 30 días' : `Últimas ${rows.length} operaciones`}
          </div>
        </div>
        <button className="text-xs text-slate-400 hover:text-white">Ver todo</button>
      </div>

      {isEmpty ? (
        <div className="py-12 text-center text-sm text-slate-500">
          El historial aparecerá cuando se cierre la primera operación
        </div>
      ) : (
        <div className="divide-y divide-bg-700/50">
          {rows.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3 hover:bg-bg-700/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{t.symbol}</span>
                  <span
                    className={clsx(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                      t.type === 'BUY'
                        ? 'bg-accent-green/10 text-accent-green'
                        : 'bg-accent-red/10 text-accent-red'
                    )}
                  >
                    {t.type}
                  </span>
                  <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded', reasonStyles[t.reason])}>
                    {t.reason}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {t.entry} → {t.exit} · {t.volume} lot · {t.closedAt}
                </div>
              </div>
              <div
                className={clsx(
                  'text-sm font-semibold font-mono',
                  t.pnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                )}
              >
                {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
