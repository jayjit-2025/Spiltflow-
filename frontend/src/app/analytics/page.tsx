'use client';

import React from 'react';
import { useActivityStore } from '@/store/useActivityStore';
import { useTxStore } from '@/store/useTxStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Activity, Coins, CheckCircle2, BarChart2 } from 'lucide-react';

const ORANGE_PALETTE = [
  '#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa',
];

export default function AnalyticsPage() {
  const { activities } = useActivityStore();
  const { transactions } = useTxStore();

  // Derive some derived/computed stats from the store data
  const totalDistributions = activities.filter((a) => a.type === 'DISTRIBUTION').length;
  const totalRegistrations = activities.filter((a) => a.type === 'REGISTRATION').length;
  const confirmedTxs = transactions.filter((t) => t.status === 'CONFIRMED').length;
  const failedTxs = transactions.filter((t) => t.status === 'FAILED').length;

  // Compute area chart data: activities grouped by hour
  const hourlyData = (() => {
    const buckets: Record<string, { time: string; distributions: number; registrations: number }> = {};
    for (const activity of activities) {
      const hour = new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!buckets[hour]) {
        buckets[hour] = { time: hour, distributions: 0, registrations: 0 };
      }
      if (activity.type === 'DISTRIBUTION') buckets[hour].distributions += 1;
      if (activity.type === 'REGISTRATION') buckets[hour].registrations += 1;
    }
    return Object.values(buckets).slice(-12);
  })();

  // Pie data: event breakdown
  const pieData = [
    { name: 'Distributions', value: totalDistributions || 1 },
    { name: 'Registrations', value: totalRegistrations || 0 },
    { name: 'Updates', value: activities.filter((a) => a.type === 'UPDATE').length || 0 },
    { name: 'Deactivations', value: activities.filter((a) => a.type === 'DEACTIVATION').length || 0 },
  ].filter((d) => d.value > 0);

  // Bar chart: transaction status breakdown
  const txStatusData = [
    { name: 'Confirmed', value: confirmedTxs },
    { name: 'Failed', value: failedTxs },
    { name: 'Pending', value: transactions.filter((t) => t.status === 'PENDING').length },
    { name: 'Processing', value: transactions.filter((t) => t.status === 'PROCESSING').length },
  ];

  // Quick stats
  const stats = [
    { label: 'Total Events', value: activities.length, icon: Activity, color: 'text-primary' },
    { label: 'Distributions', value: totalDistributions, icon: Coins, color: 'text-green-400' },
    { label: 'Registrations', value: totalRegistrations, icon: BarChart2, color: 'text-orange-400' },
    { label: 'Confirmed Txs', value: confirmedTxs, icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            <span>Analytics</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Insights and data visualization for your royalty operations and ledger events.
          </p>
        </div>
        <span className="text-xs bg-secondary border border-border px-4 py-2 rounded-xl text-muted-foreground font-medium">
          Data sourced from local activity log
        </span>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-secondary/20 glass-card-glow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-3xl font-black text-foreground">{stat.value}</span>
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart: Event Activity Over Time */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Event Activity Timeline</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distributions and registrations over time</p>
          </div>
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="distGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(224 71% 4%)',
                    border: '1px solid hsl(216 34% 17%)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#e5e7eb',
                  }}
                />
                <Area type="monotone" dataKey="distributions" name="Distributions" stroke="#f97316" fill="url(#distGradient)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="registrations" name="Registrations" stroke="#4ade80" fill="url(#regGradient)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
              No event data recorded yet. Interact with the protocol on the Activity Feed or Dashboard.
            </div>
          )}
        </div>

        {/* Pie Chart: Event Type Breakdown */}
        <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Event Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Proportion of event types</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ORANGE_PALETTE[index % ORANGE_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(224 71% 4%)',
                    border: '1px solid hsl(216 34% 17%)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#e5e7eb',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-xs text-center leading-relaxed">
              Enable Simulation Mode on the Activity Feed page to generate demo data.
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart: Transaction Status */}
      <div className="p-6 rounded-2xl border border-border bg-secondary/20 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Transaction Health</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Breakdown of transaction states across all ops</p>
        </div>
        {transactions.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={txStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(224 71% 4%)',
                  border: '1px solid hsl(216 34% 17%)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#e5e7eb',
                }}
              />
              <Bar dataKey="value" name="Count" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No transaction data yet. Submit a transaction from the Dashboard.
          </div>
        )}
      </div>
    </div>
  );
}
