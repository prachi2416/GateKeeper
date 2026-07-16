import { useState } from 'react';
import { Cpu, Database, Timer, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const algorithms = [
  {
    id: 'token_bucket',
    name: 'Token Bucket',
    icon: Database,
    description: 'A bucket holds tokens that are added at a fixed rate. Each request consumes a token. If no tokens remain, the request is blocked until tokens refill.',
    pros: ['Allows short bursts of traffic', 'Smooth traffic shaping', 'Memory efficient (O(1))', 'Easy to implement'],
    cons: ['Parameters (bucket size, refill rate) require tuning', 'Does not enforce strict rate over long periods', 'Can allow burst spikes'],
    metrics: { memory: 'Low', accuracy: 'Medium', throughput: 'High', p95: '2ms', p99: '5ms' },
  },
  {
    id: 'sliding_window_log',
    name: 'Sliding Window Log',
    icon: Timer,
    description: 'Maintains a log of request timestamps. On each request, old entries outside the window are removed. If log size exceeds limit, request is blocked.',
    pros: ['Perfect accuracy', 'No burst issues', 'Precise rate enforcement', 'Fair distribution'],
    cons: ['High memory usage (O(n))', 'Expensive cleanup operations', 'Does not scale well with high traffic', 'Redis storage costs increase'],
    metrics: { memory: 'High', accuracy: 'Very High', throughput: 'Medium', p95: '8ms', p99: '15ms' },
  },
  {
    id: 'sliding_window_counter',
    name: 'Sliding Window Counter',
    icon: Cpu,
    description: 'Combines fixed window counters with interpolation. Tracks requests in current and previous windows to estimate the sliding window count.',
    pros: ['Good balance of accuracy and performance', 'Lower memory than log', 'Better burst handling', 'Scalable with Redis'],
    cons: ['Approximation (not perfect)', 'Slightly complex implementation', 'Edge case inaccuracies', 'Requires two lookups'],
    metrics: { memory: 'Medium', accuracy: 'High', throughput: 'High', p95: '4ms', p99: '8ms' },
  },
];

const benchmarks = [
  { algorithm: 'Token Bucket', memory: 'O(1)', accuracy: 'Medium', throughput: '1M+ req/s', p95: '2ms', p99: '5ms' },
  { algorithm: 'Sliding Window Log', memory: 'O(n)', accuracy: 'Very High', throughput: '500K req/s', p95: '8ms', p99: '15ms' },
  { algorithm: 'Sliding Window Counter', memory: 'O(1)', accuracy: 'High', throughput: '800K req/s', p95: '4ms', p99: '8ms' },
];

export default function Algorithms() {
  const [selectedAlgo, setSelectedAlgo] = useState('token_bucket');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Algorithm Comparison</h1>
        <p className="text-slate-500 text-sm mt-1">Compare rate limiting algorithms and their performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {algorithms.map((algo) => {
          const Icon = algo.icon;
          const isSelected = selectedAlgo === algo.id;
          return (
            <button
              key={algo.id}
              onClick={() => setSelectedAlgo(algo.id)}
              className={`text-left p-5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/30 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                </div>
                <h3 className="font-semibold text-white">{algo.name}</h3>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{algo.description}</p>
            </button>
          );
        })}
      </div>

      {algorithms.map((algo) => {
        if (algo.id !== selectedAlgo) return null;
        return (
          <div key={algo.id} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">{algo.name} Details</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle size={14} />
                    Pros
                  </h4>
                  <ul className="space-y-1.5">
                    {algo.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <XCircle size={14} />
                    Cons
                  </h4>
                  <ul className="space-y-1.5">
                    {algo.cons.map((con, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-500 mt-2 shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Memory Usage</span>
                  <span className="text-sm text-slate-300 font-mono">{algo.metrics.memory}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Accuracy</span>
                  <span className="text-sm text-slate-300 font-mono">{algo.metrics.accuracy}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Throughput</span>
                  <span className="text-sm text-slate-300 font-mono">{algo.metrics.throughput}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">p95 Latency</span>
                  <span className="text-sm text-emerald-400 font-mono">{algo.metrics.p95}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">p99 Latency</span>
                  <span className="text-sm text-emerald-400 font-mono">{algo.metrics.p99}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Benchmark Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Algorithm</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Memory Usage</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Accuracy</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Throughput</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">p95 Latency</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">p99 Latency</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-5 py-3 text-slate-300 font-medium">{b.algorithm}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono">{b.memory}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        b.accuracy === 'Very High'
                          ? 'text-emerald-400'
                          : b.accuracy === 'High'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {b.accuracy === 'Medium' && <MinusCircle size={12} />}
                      {b.accuracy}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono">{b.throughput}</td>
                  <td className="px-5 py-3 text-emerald-400 font-mono">{b.p95}</td>
                  <td className="px-5 py-3 text-emerald-400 font-mono">{b.p99}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
