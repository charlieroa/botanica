import { Bell, Wifi, WifiOff, Activity } from 'lucide-react';
import clsx from 'clsx';
import type { ApiStatus } from '../api/client';

type Props = {
  title: string;
  subtitle: string;
  botRunning: boolean;
  onToggleBot: () => void;
  status: ApiStatus | null;
  apiError: string | null;
};

export function Header({ title, subtitle, botRunning, onToggleBot, status, apiError }: Props) {
  const mt5Connected = status?.connected ?? false;
  const terminalConnected = status?.terminal_connected ?? false;
  const backendUp = status !== null && !apiError;

  return (
    <header className="h-16 bg-bg-800 border-b border-bg-700 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border',
            backendUp && mt5Connected
              ? 'bg-accent-green/5 border-accent-green/20'
              : 'bg-accent-red/5 border-accent-red/20'
          )}
          title={apiError || status?.error || ''}
        >
          {backendUp && mt5Connected ? (
            <Wifi size={14} className="text-accent-green" />
          ) : (
            <WifiOff size={14} className="text-accent-red" />
          )}
          <span className="text-slate-300">
            {!backendUp ? 'API offline' : mt5Connected ? `MT5 · ${status?.server}` : 'MT5 desconectado'}
          </span>
          {terminalConnected && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">build {status?.terminal_build}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-700 text-xs">
          <Activity size={14} className={botRunning ? 'text-accent-green' : 'text-slate-500'} />
          <span className="text-slate-300">{botRunning ? 'En ejecución' : 'Detenido'}</span>
        </div>

        <button
          onClick={onToggleBot}
          className={
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors ' +
            (botRunning
              ? 'bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/20'
              : 'bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20')
          }
        >
          {botRunning ? 'Detener bot' : 'Iniciar bot'}
        </button>

        <button className="p-2 rounded-lg bg-bg-700 hover:bg-bg-600 text-slate-400">
          <Bell size={16} />
        </button>
      </div>
    </header>
  );
}
