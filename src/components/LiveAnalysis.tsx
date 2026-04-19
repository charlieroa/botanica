import clsx from 'clsx';
import type { BotAnalysis } from '../api/client';

type Props = {
  analysis: BotAnalysis[] | null;
};

const kindColors = {
  synthetic: 'bg-accent-purple/10 text-accent-purple',
  forex: 'bg-accent-blue/10 text-accent-blue',
  metal: 'bg-accent-amber/10 text-accent-amber',
  crypto: 'bg-accent-green/10 text-accent-green',
};

export function LiveAnalysis({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="card p-5 text-center text-slate-500 text-sm">Cargando análisis...</div>
    );
  }

  return (
    <div className="card">
      <div className="p-5 border-b border-bg-700">
        <h3 className="text-white font-semibold">Análisis en vivo</h3>
        <div className="text-xs text-slate-500">Estado actual de indicadores por símbolo</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-bg-700">
              <th className="px-5 py-3 font-medium">Símbolo</th>
              <th className="px-3 py-3 font-medium">Tipo</th>
              <th className="px-3 py-3 font-medium">TF</th>
              <th className="px-3 py-3 font-medium text-right">Precio</th>
              <th className="px-3 py-3 font-medium text-right">RSI</th>
              <th className="px-3 py-3 font-medium">Zona</th>
              <th className="px-3 py-3 font-medium">Tendencia</th>
              <th className="px-3 py-3 font-medium pr-5">Estado</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {analysis.map((a) => {
              const conditionsMet = a.trend && a.zone && a.zone !== 'neutral' &&
                ((a.zone === 'sobreventa' && a.trend === 'alcista') ||
                 (a.zone === 'sobrecompra' && a.trend === 'bajista'));
              return (
                <tr key={a.symbol} className="border-b border-bg-700/50 hover:bg-bg-700/30">
                  <td className="px-5 py-3 text-white font-sans">{a.symbol}</td>
                  <td className="px-3 py-3">
                    <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded font-sans', kindColors[a.kind])}>
                      {a.kind}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 font-sans">{a.timeframe}</td>
                  <td className="px-3 py-3 text-right text-slate-300">
                    {a.price != null ? a.price.toFixed(a.price < 10 ? 5 : 2) : '—'}
                  </td>
                  <td
                    className={clsx(
                      'px-3 py-3 text-right font-semibold',
                      a.rsi == null
                        ? 'text-slate-500'
                        : a.rsi > 70
                        ? 'text-accent-red'
                        : a.rsi < 30
                        ? 'text-accent-green'
                        : 'text-slate-300'
                    )}
                  >
                    {a.rsi?.toFixed(1) ?? '—'}
                  </td>
                  <td className="px-3 py-3">
                    {a.zone && (
                      <span
                        className={clsx(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded font-sans',
                          a.zone === 'sobrecompra'
                            ? 'bg-accent-red/10 text-accent-red'
                            : a.zone === 'sobreventa'
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-slate-600/20 text-slate-400'
                        )}
                      >
                        {a.zone}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-300 font-sans">
                    {a.trend === 'alcista' ? '↑ alcista' : a.trend === 'bajista' ? '↓ bajista' : '—'}
                  </td>
                  <td className="px-3 py-3 pr-5">
                    {a.error ? (
                      <span className="text-[11px] text-slate-500 font-sans">{a.error}</span>
                    ) : conditionsMet ? (
                      <span className="text-[11px] text-accent-amber font-sans font-medium">
                        ⚡ cerca de señal
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-sans">esperando</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
