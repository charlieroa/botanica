import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { api, type ApiStatus } from '../api/client';

type Props = {
  status: ApiStatus | null;
};

export function AlgoTradingBanner({ status }: Props) {
  const [testing, setTesting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const tradeAllowed = status?.trade_allowed ?? false;

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await api.botTestTrade('Volatility 75 Index');
      let msg: string;
      if (r.ok) {
        msg = `Orden ejecutada — ticket ${r.order} @ ${r.price} (vol ${r.volume})`;
      } else if (r.error) {
        msg = `Rechazada — ${r.error}`;
      } else {
        msg = `Rechazada — ${r.comment ?? 'sin detalle'} (retcode ${r.retcode ?? '?'})`;
      }
      setResult({ ok: r.ok, msg });
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : 'Error' });
    } finally {
      setTesting(false);
    }
  };

  const reconnect = async () => {
    setReconnecting(true);
    setResult(null);
    try {
      const s = await api.reconnect();
      setResult({
        ok: s.trade_allowed,
        msg: s.trade_allowed
          ? `Reconectado — AutoTrading ahora ACTIVO (${s.terminal_path})`
          : `Reconectado — pero AutoTrading sigue desactivado en el terminal (${s.terminal_path})`,
      });
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : 'Error' });
    } finally {
      setReconnecting(false);
    }
  };

  if (tradeAllowed && !result) return null;

  return (
    <div
      className={
        'flex items-start gap-3 p-4 rounded-lg border text-sm ' +
        (tradeAllowed
          ? 'bg-accent-green/5 border-accent-green/20'
          : 'bg-accent-red/5 border-accent-red/30')
      }
    >
      {tradeAllowed ? (
        <CheckCircle2 size={18} className="text-accent-green shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle size={18} className="text-accent-red shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        {tradeAllowed ? (
          <div className="text-accent-green font-medium">
            AutoTrading activo — el bot puede ejecutar órdenes
          </div>
        ) : (
          <div>
            <div className="text-accent-red font-medium">AutoTrading desactivado en el terminal MT5</div>
            <div className="text-slate-400 mt-1">
              Python está conectado al terminal en{' '}
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-bg-700 text-slate-300">
                {status?.terminal_path ?? '...'}
              </span>
              . Si tienes otro MT5 abierto con Algo Trading activo, Python no lo ve — cierra todos los MT5,
              abre solo uno desde ese path exacto, activa Algo Trading, y pulsa{' '}
              <span className="font-semibold text-slate-200">Reconectar</span>.
            </div>
          </div>
        )}

        {result && (
          <div
            className={
              'mt-3 flex items-start gap-2 text-xs p-2.5 rounded ' +
              (result.ok ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red')
            }
          >
            {result.ok ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
            <span className="font-mono break-all">{result.msg}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={reconnect}
          disabled={reconnecting || testing}
          className="text-xs px-3 py-1.5 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-200 disabled:opacity-50 flex items-center gap-1.5"
        >
          {reconnecting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Reconectar
        </button>
        <button
          onClick={runTest}
          disabled={testing || reconnecting}
          className="text-xs px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 disabled:opacity-50 flex items-center gap-1.5"
        >
          {testing ? <Loader2 size={12} className="animate-spin" /> : null}
          Probar orden
        </button>
      </div>
    </div>
  );
}
