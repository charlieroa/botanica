import clsx from 'clsx';
import { logs as mockLogs } from '../data/mockData';
import type { BotLog } from '../api/client';

const levelStyles = {
  INFO: 'text-slate-400',
  WARN: 'text-accent-amber',
  ERROR: 'text-accent-red',
  TRADE: 'text-accent-blue',
};

const levelBg = {
  INFO: 'bg-slate-600/20',
  WARN: 'bg-accent-amber/10',
  ERROR: 'bg-accent-red/10',
  TRADE: 'bg-accent-blue/10',
};

type Props = {
  logs?: BotLog[];
  botRunning?: boolean;
};

export function LogsPanel({ logs, botRunning }: Props) {
  const rows = logs && logs.length > 0
    ? logs
    : mockLogs.map((l) => ({ time: l.time, level: l.level, symbol: null, message: l.message } as BotLog));
  const isReal = !!logs;

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-bg-700">
        <div>
          <h3 className="text-white font-semibold">Actividad en vivo</h3>
          <div className="text-xs text-slate-500">
            {isReal ? 'Logs del bot' : 'Logs demo'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              botRunning ? 'bg-accent-green animate-pulse' : 'bg-slate-600'
            )}
          />
          <span className="text-[11px] text-slate-500">{botRunning ? 'en vivo' : 'detenido'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-96">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Arranca el bot para ver logs
          </div>
        ) : (
          rows.map((log, i) => (
            <div
              key={`${log.time}-${i}`}
              className="flex items-start gap-3 px-5 py-2.5 border-b border-bg-700/30 hover:bg-bg-700/20 font-mono text-[12px]"
            >
              <span className="text-slate-600 shrink-0">{log.time}</span>
              <span
                className={clsx(
                  'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans',
                  levelStyles[log.level],
                  levelBg[log.level]
                )}
              >
                {log.level}
              </span>
              {log.symbol && (
                <span className="text-slate-500 shrink-0 font-sans text-[11px] truncate max-w-32">
                  {log.symbol}
                </span>
              )}
              <span className="text-slate-300 leading-relaxed">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
