import { useEffect, useState } from 'react';
import { Activity, Database, Cpu, HardDrive, AlertTriangle, Ban, HeartPulse } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function generateMetricsData() {
  const data = [];
  for (let i = 0; i < 60; i++) {
    data.push({
      time: `${i}s`,
      requestRate: Math.floor(Math.random() * 300 + 100),
      redisOps: Math.floor(Math.random() * 500 + 200),
      cpuUsage: Math.floor(Math.random() * 40 + 20),
      memoryUsage: Math.floor(Math.random() * 30 + 40),
      errorRate: Math.random() * 2,
      rateLimited: Math.floor(Math.random() * 20 + 5),
    });
  }
  return data;
}

export default function Monitoring() {
  const [data] = useState(generateMetricsData());
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const widgets = [
    { title: 'Live Request Rate', value: '1,247', unit: 'req/s', icon: Activity, color: 'emerald', dataKey: 'requestRate' },
    { title: 'Redis Operations', value: '8,932', unit: 'ops/s', icon: Database, color: 'amber', dataKey: 'redisOps' },
    { title: 'Gateway CPU', value: '34.2', unit: '%', icon: Cpu, color: 'indigo', dataKey: 'cpuUsage' },
    { title: 'Gateway Memory', value: '62.8', unit: '%', icon: HardDrive, color: 'purple', dataKey: 'memoryUsage' },
    { title: 'Error Rate', value: '0.8', unit: '%', icon: AlertTriangle, color: 'red', dataKey: 'errorRate' },
    { title: '429 Responses', value: '12', unit: '/min', icon: Ban, color: 'orange', dataKey: 'rateLimited' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time system metrics and health status</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <HeartPulse className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            {loading ? 'Checking...' : health?.status === 'healthy' ? 'All Systems Healthy' : 'Issues Detected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <div key={widget.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${widget.color}-400`} />
                  <span className="text-sm text-slate-400">{widget.title}</span>
                </div>
                <span className="text-xs text-slate-600">Live</span>
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-white">{widget.value}</span>
                <span className="text-sm text-slate-500">{widget.unit}</span>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`grad-${widget.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={widget.color === 'emerald' ? '#10b981' : widget.color === 'amber' ? '#f59e0b' : widget.color === 'indigo' ? '#6366f1' : widget.color === 'purple' ? '#a855f7' : widget.color === 'red' ? '#ef4444' : '#f97316'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={widget.color === 'emerald' ? '#10b981' : widget.color === 'amber' ? '#f59e0b' : widget.color === 'indigo' ? '#6366f1' : widget.color === 'purple' ? '#a855f7' : widget.color === 'red' ? '#ef4444' : '#f97316'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={widget.dataKey}
                    stroke={widget.color === 'emerald' ? '#10b981' : widget.color === 'amber' ? '#f59e0b' : widget.color === 'indigo' ? '#6366f1' : widget.color === 'purple' ? '#a855f7' : widget.color === 'red' ? '#ef4444' : '#f97316'}
                    fill={`url(#grad-${widget.dataKey})`}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Request Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} interval={9} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="requestRate" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Redis Operations</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} interval={9} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="redisOps" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">CPU & Memory Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} interval={9} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="cpuUsage" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memoryUsage" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Error Rate & 429s</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} interval={9} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rateLimited" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
