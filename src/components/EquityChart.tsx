import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { equityCurve } from '../data/mockData';

export function EquityChart() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold">Curva de capital</h3>
          <div className="text-xs text-slate-500">Últimos 30 días</div>
        </div>
        <div className="flex gap-2 text-xs">
          {['1D', '1S', '1M', '3M', 'Todo'].map((p, i) => (
            <button
              key={p}
              className={
                'px-2.5 py-1 rounded-md ' +
                (i === 2 ? 'bg-bg-700 text-white' : 'text-slate-500 hover:text-slate-300')
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={equityCurve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2030" />
            <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#11161f',
                border: '1px solid #232a3d',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#22c55e' }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
