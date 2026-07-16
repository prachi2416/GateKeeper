import { useEffect, useState, useCallback } from 'react';
import { Upload, BarChart3, Cpu, MemoryStick, Gauge, Target, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

interface Benchmark {
  id: number;
  algorithm: string;
  throughput: number;
  requests_per_sec: number;
  p50: number;
  p95: number;
  p99: number;
  memory_usage: number;
  rejection_accuracy: number;
  created_at: string;
}

export default function Benchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const fetchBenchmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/benchmarks');
      const data = await res.json();
      setBenchmarks(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_k6', data: json }),
      });

      if (res.ok) {
        fetchBenchmarks();
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Failed to import k6 results. Make sure the file is valid JSON.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const chartData = benchmarks.map((b) => ({
    name: b.algorithm,
    throughput: Math.round(b.throughput / 1000),
    requests_per_sec: Math.round(b.requests_per_sec / 1000),
    p50: b.p50,
    p95: b.p95,
    p99: b.p99,
    memory: b.memory_usage,
    accuracy: b.rejection_accuracy,
  }));

  const metrics = [
    { label: 'Throughput', key: 'throughput', unit: 'K req/s', icon: Zap, color: '#10b981' },
    { label: 'p50 Latency', key: 'p50', unit: 'ms', icon: Gauge, color: '#6366f1' },
    { label: 'p95 Latency', key: 'p95', unit: 'ms', icon: Gauge, color: '#f59e0b' },
    { label: 'p99 Latency', key: 'p99', unit: 'ms', icon: Gauge, color: '#ef4444' },
    { label: 'Memory', key: 'memory', unit: 'MB', icon: MemoryStick, color: '#a855f7' },
    { label: 'Accuracy', key: 'accuracy', unit: '%', icon: Target, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Benchmark Results</h1>
          <p className="text-slate-500 text-sm mt-1">Rate limiting algorithm performance comparison</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors cursor-pointer">
          <Upload size={16} />
          {importing ? 'Importing...' : 'Import k6 JSON'}
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            disabled={importing}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: m.color }} />
                <span className="text-xs text-slate-500">{m.label}</span>
              </div>
              <div className="space-y-1.5">
                {chartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{d.name}</span>
                    <span className="text-xs font-mono text-slate-300">
                      {d[m.key as keyof typeof d]}{m.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={14} />
            Throughput Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Bar dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge size={14} />
            Latency Comparison (p50/p95/p99)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="p50" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p95" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="p99" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <MemoryStick size={14} />
            Memory Usage Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Bar dataKey="memory" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={14} />
            Rejection Accuracy
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} domain={[90, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Benchmark Data Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Algorithm</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Throughput</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Req/s</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">p50</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">p95</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">p99</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Memory</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8">
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-800/50 rounded animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : (
                benchmarks.map((b) => (
                  <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-5 py-3 text-slate-300 font-medium">{b.algorithm}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono">{(b.throughput / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-slate-400 font-mono">{(b.requests_per_sec / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3 text-emerald-400 font-mono">{b.p50}ms</td>
                    <td className="px-5 py-3 text-amber-400 font-mono">{b.p95}ms</td>
                    <td className="px-5 py-3 text-red-400 font-mono">{b.p99}ms</td>
                    <td className="px-5 py-3 text-purple-400 font-mono">{b.memory_usage}MB</td>
                    <td className="px-5 py-3 text-emerald-400 font-mono">{b.rejection_accuracy}%</td>
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
