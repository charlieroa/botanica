import { useState, useMemo } from 'react';
import { Search, Trash2, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import { logs as baseLogs, type LogEntry } from '../data/mockData';

const extraLogs: LogEntry[] = [
  { id: 'le1', time: '08:45:22', level: 'INFO', message: 'Conexión con MT5 establecida (build 4885)' },
  { id: 'le2', time: '08:45:25', level: 'INFO', message: 'Cuenta: Deriv Demo #41528973, Balance: $10000.00' },
  { id: 'le3', time: '08:45:30', level: 'INFO', message: 'Cargando histórico 500 velas H1 × 6 símbolos' },
  { id: 'le4', time: '08:46:12', level: 'INFO', message: 'EMA200 calculado — todos los símbolos listos' },
  { id: 'le5', time: '08:50:02', level: 'WARN', message: 'Latencia broker elevada: 842ms (límite 500ms)' },
  { id: 'le6', time: '08:52:45', level: 'INFO', message: 'Latencia normalizada: 128ms' },
  { id: 'le7', time: '10:30:00', level: 'ERROR', message: 'Fallo envío orden EURUSD — código 10016 (invalid stops)' },
  { id: 'le8', time: '10:30:05', level: 'INFO', message: 'Reintento con SL ajustado a nivel mínimo permitido (+0.8 pips)' },
  { id: 'le9', time: '10:30:06', level: 'TRADE', message: 'OPEN BUY EURUSD @ 1.0825, SL 1.0815, TP 1.0845' },
];

const all = [...extraLogs, ...baseLogs].sort((a, b) => b.time.localeCompare(a.time));

type Level = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'TRADE';

const levelStyles = {
  INFO: 'text-slate-400 bg-slate-600/20',
  WARN: 'text-accent-amber bg-accent-amber/10',
  ERROR: 'text-accent-red bg-accent-red/10',
  TRADE: 'text-accent-blue bg-accent-blue/10',
};

export function LogsView() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<Level>('ALL');
  const [paused, setPaused] = useState(false);

  const filtered = useMemo(() => {
    return all.filter((l) => {
      if (level !== 'ALL' && l.level !== level) return false;
      if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, level]);

  const counts = useMemo(() => {
    const c = { INFO: 0, WARN: 0, ERROR: 0, TRADE: 0 };
    all.forEach((l) => c[l.level]++);
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <LogStat label="INFO" value={counts.INFO} accent="slate" />
        <LogStat label="TRADE" value={counts.TRADE} accent="blue" />
        <LogStat label="WARN" value={counts.WARN} accent="amber" />
        <LogStat label="ERROR" value={counts.ERROR} accent="red" />
      </div>

      <div className="card">
        <div className="p-4 border-b border-bg-700 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en logs..."
              className="w-full bg-bg-700 border border-bg-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-1 bg-bg-700 rounded-lg p-1">
            {(['ALL', 'INFO', 'TRADE', 'WARN', 'ERROR'] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={clsx(
                  'px-2.5 py-1.5 text-xs rounded-md transition-colors',
                  level === l ? 'bg-bg-600 text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPaused(!paused)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-300 text-sm"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? 'Reanudar' : 'Pausar'}
          </button>

          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-300 text-sm">
            <Trash2 size={14} />
            Limpiar
          </button>
        </div>

        <div className="max-h-[600px] overflow-y-auto font-mono text-[12px]">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 px-5 py-2 border-b border-bg-700/30 hover:bg-bg-700/20"
            >
              <span className="text-slate-600 shrink-0 w-16">{log.time}</span>
              <span
                className={clsx(
                  'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold font-sans w-14 text-center',
                  levelStyles[log.level]
                )}
              >
                {log.level}
              </span>
              <span className="text-slate-300 leading-relaxed">{log.message}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">Sin coincidencias</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogStat({ label, value, accent }: { label: string; value: number; accent: 'slate' | 'blue' | 'amber' | 'red' }) {
  const colors = {
    slate: 'text-slate-400',
    blue: 'text-accent-blue',
    amber: 'text-accent-amber',
    red: 'text-accent-red',
  };
  return (
    <div className="card p-4">
      <div className="text-[11px] text-slate-500 mb-1">{label}</div>
      <div className={clsx('font-semibold text-xl font-mono', colors[accent])}>{value}</div>
    </div>
  );
}
