export type ViewId =
  | 'dashboard'
  | 'strategies'
  | 'backtesting'
  | 'history'
  | 'risk'
  | 'logs'
  | 'settings';

export const VIEW_TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen en tiempo real del bot' },
  strategies: { title: 'Estrategias', subtitle: 'Gestiona tus estrategias de trading' },
  backtesting: { title: 'Backtesting', subtitle: 'Prueba estrategias con datos históricos' },
  history: { title: 'Historial', subtitle: 'Todas las operaciones cerradas' },
  risk: { title: 'Gestión de riesgo', subtitle: 'Límites y parámetros de protección' },
  logs: { title: 'Logs del sistema', subtitle: 'Actividad completa del bot' },
  settings: { title: 'Ajustes', subtitle: 'Conexión, cuenta y notificaciones' },
};
