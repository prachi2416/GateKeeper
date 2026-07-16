import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, X, Filter } from 'lucide-react';

interface Client {
  client_id: string;
  tier: string;
  request_limit: number;
  requests_used: number;
  status: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ client_id: '', tier: 'free', request_limit: 100, status: 'active' });

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: editingClient.client_id, tier: formData.tier, request_limit: formData.request_limit, status: formData.status }),
        });
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData({ client_id: '', tier: 'free', request_limit: 100, status: 'active' });
      fetchClients();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleDelete = async (client_id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id }),
      });
      fetchClients();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      client_id: client.client_id,
      tier: client.tier,
      request_limit: client.request_limit,
      status: client.status,
    });
    setShowModal(true);
  };

  const filteredClients = clients.filter((c) =>
    c.client_id.toLowerCase().includes(search.toLowerCase()) ||
    c.tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">Manage API clients and rate limits</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ client_id: '', tier: 'free', request_limit: 100, status: 'active' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200">
          <Filter size={16} />
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Client ID</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Tier</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Request Limit</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Requests Used</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                          <Search className="w-5 h-5 text-slate-500" />
                        </div>
                        <p className="text-slate-500">No clients found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.client_id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{client.client_id}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            client.tier === 'enterprise'
                              ? 'bg-indigo-500/10 text-indigo-400'
                              : client.tier === 'pro'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {client.tier}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{client.request_limit.toLocaleString()}/min</td>
                      <td className="px-5 py-3 text-slate-400">{client.requests_used?.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            client.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEdit(client)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(client.client_id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Client ID</label>
                <input
                  type="text"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  placeholder="client-001"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Custom Limit (requests/min)</label>
                <input
                  type="number"
                  value={formData.request_limit}
                  onChange={(e) => setFormData({ ...formData, request_limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
