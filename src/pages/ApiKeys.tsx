import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

type Algorithm =
  | "token-bucket"
  | "sliding-window-log"
  | "sliding-window-counter";

interface Client {
  id: string;
  name: string;
  apiKey: string;
  algorithm: Algorithm;
  limit: number;
  windowMs: number;
  refillRate: number;
  status: "active" | "disabled";
  createdAt: string;
}

interface ApiResponse {
  success?: boolean;
  clients?: Client[];
  client?: Client;
  error?: string;
  message?: string;
}

export default function ApiKeys() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/clients");
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load API keys.");
      }

      if (!Array.isArray(data.clients)) {
        throw new Error("Unexpected response from the clients API.");
      }

      setClients(data.clients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const generateKey = async () => {
    const name = newKeyName.trim();

    if (!name) {
      setError("Enter a name for the new API key.");
      return;
    }

    setCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          algorithm: "token-bucket",
          limit: 10,
          windowMs: 1000,
          refillRate: 1,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create an API key.");
      }

      await fetchClients();

      // The secret is shown only if the API returns it.
      if (data.client?.id && data.client.apiKey) {
        setShowKey((previous) => ({
          ...previous,
          [data.client!.id]: true,
        }));
        setNotice(
          "Client and API key created. Copy the key and store it securely.",
        );
      } else {
        setNotice("Client created. Check the Clients page for its API key.");
      }

      setNewKeyName("");
      setShowCreate(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create an API key.",
      );
    } finally {
      setCreating(false);
    }
  };

  const toggleClientStatus = async (client: Client) => {
    const disabling = client.status === "active";
    const action = disabling ? "disable" : "enable";

    if (
      !window.confirm(
        `${disabling ? "Disable" : "Enable"} "${client.name}"? This changes whether its API key can access the gateway.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(client.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: disabling ? "disabled" : "active",
          }),
        },
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Unable to ${action} this API key.`);
      }

      setNotice(`API key "${client.name}" ${action}d successfully.`);
      await fetchClients();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} this API key.`,
      );
    }
  };

  const deleteClient = async (client: Client) => {
    if (
      !window.confirm(
        `Permanently delete "${client.name}" and its API key? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(client.id)}`,
        {
          method: "DELETE",
        },
      );

      const data: ApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this API key.");
      }

      setShowKey((previous) => {
        const next = { ...previous };
        delete next[client.id];
        return next;
      });

      setNotice(`"${client.name}" and its API key were deleted.`);
      await fetchClients();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete this API key.",
      );
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setNotice("API key copied to clipboard.");
      setError("");
    } catch {
      setError("Clipboard access failed. Copy the key manually instead.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage API keys used to authenticate gateway clients.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void fetchClients()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={() => {
              setShowCreate((previous) => !previous);
              setError("");
              setNotice("");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg"
          >
            <Plus size={16} />
            Generate Key
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-300"
        >
          {notice}
        </div>
      )}

      {showCreate && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Create Client and API Key
          </h2>

          <p className="text-sm text-slate-400 mb-4">
            A new client is created with the default Token Bucket configuration.
            You can change its rate-limit settings from the Clients page.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void generateKey();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              placeholder="Client name (e.g. Production API)"
              required
              maxLength={100}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />

            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {creating ? "Creating..." : "Create Key"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Client API Keys</h2>
          <p className="text-xs text-slate-500 mt-1">
            {clients.length} client{clients.length === 1 ? "" : "s"} registered
          </p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-12 bg-slate-800/50 rounded animate-pulse"
              />
            ))}
          </div>
        ) : clients.length === 0 && !error ? (
          <div className="p-12 text-center text-slate-500">
            No clients or API keys found. Select Generate Key to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Client
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    API Key
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Algorithm
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Limit
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">
                    Created
                  </th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3 text-slate-300 font-medium">
                      {client.name}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded max-w-48 truncate">
                          {showKey[client.id]
                            ? client.apiKey
                            : `••••••••${client.apiKey?.slice(-4) || "hidden"}`}
                        </code>

                        <button
                          type="button"
                          onClick={() =>
                            setShowKey((previous) => ({
                              ...previous,
                              [client.id]: !previous[client.id],
                            }))
                          }
                          title={showKey[client.id] ? "Hide key" : "Show key"}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {showKey[client.id] ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={!client.apiKey}
                          onClick={() => void copyKey(client.apiKey)}
                          title="Copy API key"
                          className="text-slate-500 hover:text-emerald-400 disabled:opacity-30"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3 text-slate-400">
                      {client.algorithm}
                    </td>

                    <td className="px-5 py-3 text-slate-400">
                      {client.limit} / {client.windowMs} ms
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          client.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleClientStatus(client)}
                          title={
                            client.status === "active"
                              ? "Disable key"
                              : "Enable key"
                          }
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteClient(client)}
                          title="Delete client and key"
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
