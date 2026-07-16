import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Metrics {
  total: number;
  allowed: number;
  blocked: number;
  successRate: string;
  avgLatency: string;
  activeClients: number;
}

interface RequestLog {
  id: number;
  timestamp: string;
  client_id: string;
  endpoint: string;
  status: string;
  algorithm: string;
  response_time: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

function generateTimeSeriesData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      rps: Math.floor(Math.random() * 500 + 200),
      allowed: Math.floor(Math.random() * 400 + 150),
      blocked: Math.floor(Math.random() * 100 + 20),
      p50: Math.floor(Math.random() * 30 + 10),
      p95: Math.floor(Math.random() * 80 + 40),
      p99: Math.floor(Math.random() * 150 + 80),
    });
  }
  return data;
}

function generateTierData() {
  return [
    { name: 'Free', value: 4500, color: '#10b981' },
    { name: 'Pro', value: 3200, color: '#f59e0b' },
    { name: 'Enterprise', value: 1800, color: '#6366f1' },
  ];
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSeriesData] = useState(generateTimeSeriesData());
  const [tierData] = useState(generateTierData());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, logsRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/request-logs?limit=10'),
        ]);
        const metricsData = await metricsRes.json();
        const logsData = await logsRes.json();
        setMetrics(metricsData);
        setLogs(logsData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiCards = [
    {
      title: 'Total Requests',
      value: metrics?.total?.toLocaleString() || '0',
      icon: Activity,
      change: '+12.5%',
      up: true,
      color: 'emerald',
    },
    {
      title: 'Allowed Requests',
      value: metrics?.allowed?.toLocaleString() || '0',
      icon: CheckCircle,
      change: '+8.2%',
      up: true,
      color: 'emerald',
    },
    {
      title: 'Blocked Requests',
      value: metrics?.blocked?.toLocaleString() || '0',
      icon: XCircle,
      change: '-3.1%',
      up: false,
      color: 'red',
    },
    {
      title: 'Success Rate',
      value: `${metrics?.successRate || 0}%`,
      icon: TrendingUp,
      change: '+1.2%',
      up: true,
      color: 'emerald',
    },
    {
      title: 'Avg Latency',
      value: `${metrics?.avgLatency || 0}ms`,
      icon: Clock,
      change: '-5ms',
      up: true,
      color: 'amber',
    },
    {
      title: 'Active Clients',
      value: metrics?.activeClients?.toString() || '0',
      icon: Users,
      change: '+4',
      up: true,
      color: 'indigo',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time API gateway performance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${card.color}-500/10`}>
                  <Icon className={`w-5 h-5 text-${card.color}-400`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {card.up ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-400" />
                )}
                <span className={`text-xs font-medium ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.change}
                </span>
                <span className="text-xs text-slate-600 ml-1">vs last hour</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Requests Per Second</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="rps" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Allowed vs Blocked Requests</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Area type="monotone" dataKey="allowed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Area type="monotone" dataKey="blocked" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Latency Distribution (p50/p95/p99)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend />
              <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Requests by Tier</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {tierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Timestamp</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Client ID</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Endpoint</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Algorithm</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No recent activity found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">{log.client_id}</td>
                    <td className="px-5 py-3 text-slate-300">{log.endpoint}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'allowed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 capitalize">{log.algorithm?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-slate-400">{log.response_time}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
