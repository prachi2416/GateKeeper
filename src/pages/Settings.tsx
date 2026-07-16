import { useEffect, useState } from 'react';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';

interface RateLimitSettings {
  id: number;
  tier: string;
  requests_per_minute: number;
  burst_capacity: number;
  refill_rate: number;
}

interface SystemSettings {
  id: number;
  redis_host: string;
  redis_port: number;
  algorithm_selection: string;
}

export default function Settings() {
  const [rateLimits, setRateLimits] = useState<RateLimitSettings[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rlRes, sysRes] = await Promise.all([
          fetch('/api/rate-limits'),
          fetch('/api/system-settings'),
        ]);
        const rlData = await rlRes.json();
        const sysData = await sysRes.json();
        setRateLimits(rlData);
        setSystemSettings(sysData);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRateLimitChange = (id: number, field: string, value: number) => {
    setRateLimits((prev) =>
      prev.map((rl) => (rl.id === id ? { ...rl, [field]: value } : rl))
    );
  };

  const handleSystemChange = (field: string, value: string | number) => {
    setSystemSettings((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        ...rateLimits.map((rl) =>
          fetch('/api/rate-limits', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rl),
          })
        ),
        systemSettings &&
          fetch('/api/system-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(systemSettings),
          }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-900 border border-slate-800 rounded-xl animate-pulse w-48" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure rate limits and system preferences</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">Settings saved successfully</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Rate Limit Configuration</h3>
        <div className="space-y-6">
          {rateLimits.map((rl) => (
            <div key={rl.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    rl.tier === 'enterprise'
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : rl.tier === 'pro'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {rl.tier}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Requests Per Minute
                  </label>
                  <input
                    type="number"
                    value={rl.requests_per_minute}
                    onChange={(e) => handleRateLimitChange(rl.id, 'requests_per_minute', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Burst Capacity
                  </label>
                  <input
                    type="number"
                    value={rl.burst_capacity}
                    onChange={(e) => handleRateLimitChange(rl.id, 'burst_capacity', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Refill Rate (tokens/sec)
                  </label>
                  <input
                    type="number"
                    value={rl.refill_rate}
                    onChange={(e) => handleRateLimitChange(rl.id, 'refill_rate', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Redis Host</label>
            <input
              type="text"
              value={systemSettings?.redis_host || ''}
              onChange={(e) => handleSystemChange('redis_host', e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Redis Port</label>
            <input
              type="number"
              value={systemSettings?.redis_port || ''}
              onChange={(e) => handleSystemChange('redis_port', Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Default Algorithm</label>
            <select
              value={systemSettings?.algorithm_selection || 'token_bucket'}
              onChange={(e) => handleSystemChange('algorithm_selection', e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="token_bucket">Token Bucket</option>
              <option value="sliding_window_log">Sliding Window Log</option>
              <option value="sliding_window_counter">Sliding Window Counter</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
