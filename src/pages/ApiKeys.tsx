import { useEffect, useState } from 'react';
import { KeyRound, Plus, Copy, Trash2, BarChart3, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  key_hash: string;
  usage_count: number;
  status: string;
  created_at: string;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const generateKey = async () => {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'New API Key' }),
      });
      if (res.ok) {
        setNewKeyName('');
        setShowCreate(false);
        fetchKeys();
      }
    } catch (err) {
      console.error('Generate error:', err);
    }
  };

  const revokeKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await fetch('/api/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'revoked' }),
      });
      fetchKeys();
    } catch (err) {
      console.error('Revoke error:', err);
    }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Permanently delete this API key?')) return;
    try {
      await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchKeys();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-500 text-sm mt-1">Manage API keys for gateway access</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Generate Key
        </button>
      </div>

      {showCreate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Generate New API Key</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Production)"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              onClick={generateKey}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">API Key</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Usage</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Created</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      No API keys found
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-5 py-3 text-slate-300 font-medium">{k.name}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded">
                            {showKey[k.id] ? k.key : k.key_hash}
                          </code>
                          <button
                            onClick={() => setShowKey((prev) => ({ ...prev, [k.id]: !prev[k.id] }))}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            {showKey[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => copyKey(k.key)}
                            className="text-slate-500 hover:text-emerald-400"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        <div className="flex items-center gap-1">
                          <BarChart3 size={12} />
                          {k.usage_count.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            k.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {k.status === 'active' && (
                            <button
                              onClick={() => revokeKey(k.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                              title="Revoke"
                            >
                              <KeyRound size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteKey(k.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
