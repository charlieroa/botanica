import { useState } from 'react';
import { Wifi, User, Bell, Save, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export function SettingsView() {
  const [saved, setSaved] = useState(false);
  const [telegram, setTelegram] = useState(true);
  const [email, setEmail] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(true);
  const [notifyClose, setNotifyClose] = useState(true);
  const [notifyErrors, setNotifyErrors] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Wifi size={18} className="text-accent-blue" />
          <h3 className="text-white font-semibold">Conexión MT5</h3>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-accent-green">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Conectado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Servidor">
            <input
              defaultValue="DerivSVG-Demo"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </Field>
          <Field label="Número de cuenta">
            <input
              defaultValue="41528973"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </Field>
          <Field label="Contraseña (inversor)">
            <input
              type="password"
              defaultValue="••••••••••••"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </Field>
          <Field label="Path terminal MT5">
            <input
              defaultValue="C:\Program Files\MetaTrader 5\terminal64.exe"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </Field>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="text-xs px-3 py-1.5 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-200">
            Test de conexión
          </button>
          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20">
            Desconectar
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-accent-purple" />
          <h3 className="text-white font-semibold">Cuenta</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre">
            <input
              defaultValue="Carlos Roa"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>
          <Field label="Email">
            <input
              defaultValue="aprendelaa@gmail.com"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>
          <Field label="Empresa">
            <input
              defaultValue="DIDIMOSOFT LLC"
              className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white"
            />
          </Field>
          <Field label="Zona horaria">
            <select className="w-full bg-bg-700 border border-bg-600 rounded-lg px-3 py-2 text-sm text-white">
              <option>UTC-05:00 (Colombia)</option>
              <option>UTC+00:00 (GMT)</option>
              <option>UTC+01:00 (Madrid)</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-accent-amber" />
          <h3 className="text-white font-semibold">Notificaciones</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Check label="Telegram" value={telegram} onChange={setTelegram} hint="Bot: @pluribots_trading_bot" />
            <Check label="Email" value={email} onChange={setEmail} hint={email ? 'Activado' : 'Desactivado'} />
          </div>

          <div className="pt-4 border-t border-bg-700/50">
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Eventos</div>
            <div className="space-y-2">
              <Check label="Apertura de operación" value={notifyOpen} onChange={setNotifyOpen} />
              <Check label="Cierre de operación" value={notifyClose} onChange={setNotifyClose} />
              <Check label="Errores y alertas" value={notifyErrors} onChange={setNotifyErrors} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-accent-green">
            <CheckCircle2 size={14} />
            Guardado
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 text-sm font-medium"
        >
          <Save size={14} />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Check({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={clsx(
          'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
          value ? 'bg-accent-blue border-accent-blue' : 'border-bg-600 bg-bg-700'
        )}
      >
        {value && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{label}</div>
        {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
      </div>
    </label>
  );
}
