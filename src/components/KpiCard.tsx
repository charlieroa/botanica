import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon: LucideIcon;
  accent?: 'green' | 'red' | 'blue' | 'amber' | 'purple';
};

const accents = {
  green: 'bg-accent-green/10 text-accent-green',
  red: 'bg-accent-red/10 text-accent-red',
  blue: 'bg-accent-blue/10 text-accent-blue',
  amber: 'bg-accent-amber/10 text-accent-amber',
  purple: 'bg-accent-purple/10 text-accent-purple',
};

export function KpiCard({ label, value, delta, positive, icon: Icon, accent = 'blue' }: Props) {
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', accents[accent])}>
          <Icon size={18} />
        </div>
        {delta && (
          <div
            className={clsx(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
              positive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
            )}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta}
          </div>
        )}
      </div>
      <div className="text-[13px] text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-white font-mono tracking-tight">{value}</div>
    </div>
  );
}
