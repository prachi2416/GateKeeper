import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, X, Filter } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  apiKey: string;
  algorithm: "token-bucket" | "sliding-window-log" | "sliding-window-counter";
  limit: number;
  windowMs: number;
  refillRate: number;
  status: "active" | "disabled";
  createdAt: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    algorithm: "token-bucket",
    limit: 10,
    windowMs: 1000,
    refillRate: 1,
    status: "active",
  });

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      const data = await response.json();

      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setClients([]);
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
        const response = await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`Update failed: ${response.status}`);
        }
      } else {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`Create failed: ${response.status}`);
        }
      }

      setShowModal(false);
      setEditingClient(null);

      setFormData({
        name: "",
        algorithm: "token-bucket",
        limit: 10,
        windowMs: 1000,
        refillRate: 1,
        status: "active",
      });

      fetchClients();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      fetchClients();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);

    setFormData({
      name: client.name,
      algorithm: client.algorithm,
      limit: client.limit,
      windowMs: client.windowMs,
      refillRate: client.refillRate,
      status: client.status,
    });

    setShowModal(true);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.id.toLowerCase().includes(search.toLowerCase()) ||
      client.algorithm.toLowerCase().includes(search.toLowerCase()) ||
      client.status.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage API clients and rate limits
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({
              name: "",
              algorithm: "token-bucket",
              limit: 10,
              windowMs: 1000,
              refillRate: 1,
              status: "active",
            });
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
              <div
                key={i}
                className="h-12 bg-slate-800/50 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Client ID
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Algorithm
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Limit
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Window
                  </th>
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
                    <tr
                      key={client.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">
                        {client.id}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                          {client.algorithm}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {client.limit.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {client.windowMs.toLocaleString()} ms
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            client.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
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
                            onClick={() => handleDelete(client.id)}
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
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingClient ? "Edit Client" : "Add Client"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Client Name
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My API Client"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                    required
                  />
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Algorithm
                  </label>

                  <select
                    value={formData.algorithm}
                    onChange={(e) =>
                      setFormData({ ...formData, algorithm: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                  >
                    <option value="token-bucket">Token Bucket</option>
                    <option value="sliding-window-log">
                      Sliding Window Log
                    </option>
                    <option value="sliding-window-counter">
                      Sliding Window Counter
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Request Limit
                  </label>

                  <input
                    type="number"
                    value={formData.limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limit: Number(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
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
                  {editingClient ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
