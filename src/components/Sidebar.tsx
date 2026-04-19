import { LayoutDashboard, LineChart, Settings2, History, BookOpen, Zap, Shield } from 'lucide-react';
import clsx from 'clsx';
import type { ViewId } from '../types';

const items: { id: ViewId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'strategies', icon: LineChart, label: 'Estrategias' },
  { id: 'backtesting', icon: Zap, label: 'Backtesting' },
  { id: 'history', icon: History, label: 'Historial' },
  { id: 'risk', icon: Shield, label: 'Riesgo' },
  { id: 'logs', icon: BookOpen, label: 'Logs' },
  { id: 'settings', icon: Settings2, label: 'Ajustes' },
];

type Props = {
  active: ViewId;
  onNavigate: (id: ViewId) => void;
};

export function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="w-60 bg-bg-800 border-r border-bg-700 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-bg-700">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-white">
          B
        </div>
        <div>
          <div className="font-semibold text-white leading-tight">BotTrading</div>
          <div className="text-[11px] text-slate-500 leading-tight">MT5 · Deriv</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-bg-700 text-white'
                  : 'text-slate-400 hover:bg-bg-700/50 hover:text-slate-200'
              )}
            >
              <Icon size={18} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-bg-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-bg-700 flex items-center justify-center text-sm font-semibold">
            CR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">Carlos Roa</div>
            <div className="text-[11px] text-slate-500 truncate">DIDIMOSOFT</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
