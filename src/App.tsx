import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { StrategiesView } from './views/StrategiesView';
import { BacktestingView } from './views/BacktestingView';
import { HistoryView } from './views/HistoryView';
import { RiskView } from './views/RiskView';
import { LogsView } from './views/LogsView';
import { SettingsView } from './views/SettingsView';
import { VIEW_TITLES, type ViewId } from './types';
import { useApi } from './hooks/useApi';
import { api } from './api/client';
import './App.css';

function App() {
  const [view, setView] = useState<ViewId>('dashboard');

  const status = useApi(api.status, 5000);
  const summary = useApi(api.summary, 3000);
  const botStatus = useApi(api.botStatus, 2000);
  const botLogs = useApi(() => api.botLogs(80), 2000);
  const analysis = useApi(api.botAnalysis, 10000);

  const botRunning = botStatus.data?.running ?? false;

  const toggleBot = useCallback(async () => {
    try {
      if (botRunning) {
        await api.botStop();
      } else {
        await api.botStart(30);
      }
    } catch (e) {
      console.error('bot toggle failed', e);
    }
  }, [botRunning]);

  // sync page title with bot state for visibility
  useEffect(() => {
    document.title = botRunning ? '● BotTrading — running' : 'BotTrading';
  }, [botRunning]);

  const header = VIEW_TITLES[view];

  return (
    <div className="flex h-screen bg-bg-900">
      <Sidebar active={view} onNavigate={setView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={header.title}
          subtitle={header.subtitle}
          botRunning={botRunning}
          onToggleBot={toggleBot}
          status={status.data}
          apiError={status.error}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'dashboard' && (
            <DashboardView
              botRunning={botRunning}
              onToggleBot={toggleBot}
              summary={summary.data}
              status={status.data}
              botStatus={botStatus.data}
              botLogs={botLogs.data}
              analysis={analysis.data}
            />
          )}
          {view === 'strategies' && <StrategiesView />}
          {view === 'backtesting' && <BacktestingView />}
          {view === 'history' && <HistoryView />}
          {view === 'risk' && <RiskView />}
          {view === 'logs' && <LogsView />}
          {view === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default App;
