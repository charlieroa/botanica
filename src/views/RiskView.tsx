import { useState } from 'react';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

export function RiskView() {
  const [riskPerTrade, setRiskPerTrade] = useState(1.0);
  const [maxDailyLoss, setMaxDailyLoss] = useState(3);
  const [maxDrawdown, setMaxDrawdown] = useState(10);
  const [maxPositions, setMaxPositions] = useState(3);
  const [stopAfterLosses, setStopAfterLosses] = useState(3);
  const [trailingEnabled, setTrailingEnabled] = useState(true);
  const [newsFilter, setNewsFilter] = useState(true);
  const [weekendClose, setWeekendClose] = useState(true);

  const balance = 10427.85;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-amber/5 border border-accent-amber/20">
        <AlertTriangle size={18} className="text-accent-amber shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="text-accent-amber font-medium">Gestión de riesgo es lo único que separa un bot rentable de una cuenta quemada</div>
          <div className="text-slate-400 mt-1">Estos límites se aplican globalmente. El bot se detiene automáticamente si se violan.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} className="text-accent-blue" />
            <h3 className="text-white font-semibold">Límites por operación</h3>
          </div>

          <Slider
            label="Riesgo por trade"
            value={riskPerTrade}
            onChange={setRiskPerTrade}
            min={0.1}
            max={5}
            step={0.1}
            suffix="%"
            hint={`$${((balance * riskPerTrade) / 100).toFixed(2)} máximo por operación`}
            warning={riskPerTrade > 2}
          />

          <Slider
            label="Posiciones máximas simultáneas"
            value={maxPositions}
            onChange={setMaxPositions}
            min={1}
            max={10}
            step={1}
            hint="Diversifica sin sobreexposición"
          />

          <div className="pt-4 border-t border-bg-700/50 space-y-3">
            <Toggle
              label="Trailing stop"
              description="SL dinámico que sigue al precio favorable"
              value={trailingEnabled}
              onChange={setTrailingEnabled}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle size={18} className="text-accent-red" />
            <h3 className="text-white font-semibold">Circuit breakers</h3>
          </div>

          <Slider
            label="Pérdida máxima diaria"
            value={maxDailyLoss}
            onChange={setMaxDailyLoss}
            min={1}
            max={10}
            step={0.5}
            suffix="%"
            hint={`Bot se detiene si pierde más de $${((balance * maxDailyLoss) / 100).toFixed(2)} en un día`}
            warning={maxDailyLoss > 5}
          />

          <Slider
            label="Drawdown máximo"
            value={maxDrawdown}
            onChange={setMaxDrawdown}
            min={5}
            max={30}
            step={1}
            suffix="%"
            hint="Pausa global si la cuenta cae más de este %"
            warning={maxDrawdown > 15}
          />

          <Slider
            label="Stop tras pérdidas consecutivas"
            value={stopAfterLosses}
            onChange={setStopAfterLosses}
            min={2}
            max={10}
            step={1}
            hint="Evita rachas negativas — posible cambio de régimen de mercado"
          />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Info size={18} className="text-accent-purple" />
          <h3 className="text-white font-semibold">Filtros adicionales</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle
            label="Filtro de noticias de alto impacto"
            description="Pausa trades 30min antes/después de NFP, FOMC, ECB, etc."
            value={newsFilter}
            onChange={setNewsFilter}
          />
          <Toggle
            label="Cerrar posiciones el viernes"
            description="Evita gaps de fin de semana cerrando todo a las 21:00 GMT"
            value={weekendClose}
            onChange={setWeekendClose}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-300 text-sm">
          Restablecer
        </button>
        <button className="px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 text-sm font-medium">
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  hint,
  warning,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-300">{label}</label>
        <span
          className={clsx(
            'font-mono font-semibold text-sm px-2 py-0.5 rounded',
            warning ? 'bg-accent-amber/10 text-accent-amber' : 'bg-bg-700 text-white'
          )}
        >
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-accent-blue"
      />
      {hint && <div className="text-[11px] text-slate-500 mt-1.5">{hint}</div>}
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5',
          value ? 'bg-accent-green' : 'bg-bg-700'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
