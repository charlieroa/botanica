import { Settings, Play, Pause, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { BotStatus } from '../api/client';

type Props = {
  botRunning: boolean;
  onToggleBot: () => Promise<void> | void;
  botStatus: BotStatus | null;
};

export function BotControls({ botRunning, onToggleBot, botStatus }: Props) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onToggleBot();
    } finally {
      setLoading(false);
    }
  };

  const symbolsActive = botStatus?.symbols.filter((s) => s.enabled).length ?? 8;
  const paused = botStatus?.risk_state.paused ?? false;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Control del bot</h3>
          <div className="text-xs text-slate-500">
            {botStatus?.running ? `${botStatus.scans_total} scans · ${botStatus.signals_total} señales` : 'Inactivo'}
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-bg-700 text-slate-400">
          <Settings size={16} />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <Row label="Estrategia" value="RSI + EMA200 + PA" />
        <Row label="Símbolos" value={`${symbolsActive} activos`} />
        <Row label="Riesgo / trade" value="1.0%" />
        <Row label="Ratio R:R" value="1:2" />
        {botStatus?.management && (
          <>
            <Row
              label="Breakeven"
              value={`al ${(botStatus.management.breakeven_at_pct * 100).toFixed(0)}% del TP`}
            />
            <Row
              label="Trailing stop"
              value={`al ${(botStatus.management.trailing_at_pct * 100).toFixed(0)}% (${botStatus.management.trailing_atr_mult} ATR)`}
            />
          </>
        )}
        {botStatus?.guard && (
          <Row
            label="Pre-shutdown"
            value={`${botStatus.guard.trigger_at} · BE diario + cerrar forex viernes`}
          />
        )}
        {botStatus?.running && botStatus.last_scan && (
          <Row label="Último escaneo" value={botStatus.last_scan} />
        )}
        {botStatus?.running && (
          <Row label="Trades abiertos por bot" value={`${botStatus.trades_opened}`} />
        )}
      </div>

      {paused && (
        <div className="mb-3 p-2.5 rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-xs text-accent-amber">
          ⚠ {botStatus?.risk_state.pause_reason}
        </div>
      )}

      <button
        onClick={handle}
        disabled={loading}
        className={
          'w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ' +
          (botRunning
            ? 'bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/20'
            : 'bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20')
        }
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : botRunning ? <Pause size={16} /> : <Play size={16} />}
        {botRunning ? 'Detener bot' : 'Iniciar bot'}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}
