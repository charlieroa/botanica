import { Wallet, DollarSign, TrendingUp, Activity, Target, AlertTriangle } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { EquityChart } from '../components/EquityChart';
import { PositionsTable } from '../components/PositionsTable';
import { TradeHistory } from '../components/TradeHistory';
import { BotControls } from '../components/BotControls';
import { LogsPanel } from '../components/LogsPanel';
import { AlgoTradingBanner } from '../components/AlgoTradingBanner';
import { LiveAnalysis } from '../components/LiveAnalysis';
import { kpis as mockKpis } from '../data/mockData';
import type { ApiSummary, ApiStatus, BotStatus, BotLog, BotAnalysis } from '../api/client';

type Props = {
  botRunning: boolean;
  onToggleBot: () => Promise<void> | void;
  summary: ApiSummary | null;
  status: ApiStatus | null;
  botStatus: BotStatus | null;
  botLogs: BotLog[] | null;
  analysis: BotAnalysis[] | null;
};

export function DashboardView({ botRunning, onToggleBot, summary, status, botStatus, botLogs, analysis }: Props) {
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const k = summary?.kpis ?? {
    balance: mockKpis.balance,
    equity: mockKpis.equity,
    pnlToday: mockKpis.pnlToday,
    pnlTotal: mockKpis.pnlTotal,
    winRate: mockKpis.winRate,
    openPositions: mockKpis.openPositions,
    tradesTotal: mockKpis.tradesToday,
  };

  const floating = k.equity - k.balance;

  return (
    <div className="space-y-6">
      <AlgoTradingBanner status={status} />

      {summary && summary.positions.length === 0 && summary.recentTrades.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent-blue/5 border border-accent-blue/20 text-sm">
          <Activity size={18} className="text-accent-blue shrink-0 mt-0.5" />
          <div>
            <div className="text-accent-blue font-medium">Cuenta conectada, sin operaciones aún</div>
            <div className="text-slate-400 mt-1">
              Balance real: <span className="font-mono">${fmt(k.balance)}</span> · Cuando el bot (o tú) abra trades aparecerán aquí en tiempo real.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Balance"
          value={`$${fmt(k.balance)}`}
          icon={Wallet}
          accent="blue"
        />
        <KpiCard
          label="Equity"
          value={`$${fmt(k.equity)}`}
          delta={floating !== 0 ? `${floating >= 0 ? '+' : ''}$${fmt(floating)}` : undefined}
          positive={floating >= 0}
          icon={DollarSign}
          accent="green"
        />
        <KpiCard
          label="P&L hoy"
          value={`${k.pnlToday >= 0 ? '+' : ''}$${fmt(k.pnlToday)}`}
          delta={`${k.tradesTotal} trades`}
          positive={k.pnlToday >= 0}
          icon={TrendingUp}
          accent={k.pnlToday >= 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="Win rate"
          value={`${k.winRate}%`}
          icon={Target}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EquityChart />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Abiertas" value={`${k.openPositions}`} icon={Activity} accent="blue" />
            <KpiCard label="Trades totales" value={`${k.tradesTotal}`} icon={AlertTriangle} accent="amber" />
          </div>
          <BotControls botRunning={botRunning} onToggleBot={onToggleBot} botStatus={botStatus} />
        </div>
      </div>

      <LiveAnalysis analysis={analysis} />

      <PositionsTable positions={summary?.positions} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeHistory trades={summary?.recentTrades} />
        <LogsPanel logs={botLogs ?? undefined} botRunning={botRunning} />
      </div>
    </div>
  );
}
