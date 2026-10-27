import { useEffect, useState } from "react";
import { Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";

interface RateLimitSettings {
  id: string;
  name: string;
  algorithm: string;
  description: string;
}

interface SystemSettings {
  serviceName: string;
  environment: string;
  port: number;
  redisHost: string;
  redisPort: number;
  defaultAlgorithm: string;
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  serviceName: "GateKeeper",
  environment: "development",
  port: 5000,
  redisHost: "127.0.0.1",
  redisPort: 6379,
  defaultAlgorithm: "token-bucket",
};

const ALGORITHMS: RateLimitSettings[] = [
  {
    id: "token-bucket",
    name: "Token Bucket",
    algorithm: "token-bucket",
    description: "Allows bursts and replenishes tokens at a configured rate.",
  },
  {
    id: "sliding-window-log",
    name: "Sliding Window Log",
    algorithm: "sliding-window-log",
    description: "Tracks individual requests within a rolling time window.",
  },
  {
    id: "sliding-window-counter",
    name: "Sliding Window Counter",
    algorithm: "sliding-window-counter",
    description: "Estimates rolling-window usage using adjacent window counts.",
  },
];

export default function Settings() {
  const [rateLimits, setRateLimits] = useState<RateLimitSettings[]>([]);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(
    DEFAULT_SYSTEM_SETTINGS,
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const [rateLimitResponse, systemResponse] = await Promise.all([
          fetch("/api/rate-limits"),
          fetch("/api/system-settings"),
        ]);

        if (!rateLimitResponse.ok) {
          throw new Error(
            `Rate-limit settings request failed (${rateLimitResponse.status})`,
          );
        }

        if (!systemResponse.ok) {
          throw new Error(
            `System settings request failed (${systemResponse.status})`,
          );
        }

        const rateLimitData = await rateLimitResponse.json();
        const systemData = await systemResponse.json();

        const fetchedRateLimits = Array.isArray(rateLimitData)
          ? rateLimitData
          : Array.isArray(rateLimitData?.rateLimits)
            ? rateLimitData.rateLimits
            : [];

        const fetchedSystemSettings = systemData?.settings ?? systemData;

        if (cancelled) return;

        setRateLimits(fetchedRateLimits);

        setSystemSettings({
          serviceName:
            fetchedSystemSettings?.serviceName ??
            DEFAULT_SYSTEM_SETTINGS.serviceName,
          environment:
            fetchedSystemSettings?.environment ??
            DEFAULT_SYSTEM_SETTINGS.environment,
          port: Number(
            fetchedSystemSettings?.port ?? DEFAULT_SYSTEM_SETTINGS.port,
          ),
          redisHost:
            fetchedSystemSettings?.redisHost ??
            DEFAULT_SYSTEM_SETTINGS.redisHost,
          redisPort: Number(
            fetchedSystemSettings?.redisPort ??
              DEFAULT_SYSTEM_SETTINGS.redisPort,
          ),
          defaultAlgorithm:
            fetchedSystemSettings?.defaultAlgorithm ??
            DEFAULT_SYSTEM_SETTINGS.defaultAlgorithm,
        });
      } catch (error) {
        console.error("Settings fetch error:", error);

        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load settings.",
          );
          setRateLimits(ALGORITHMS);
          setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSystemChange = (
    field: keyof SystemSettings,
    value: string | number,
  ) => {
    setSystemSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleReset = () => {
    setRateLimits(ALGORITHMS);
    setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
    setSaved(false);
    setLoadError("");
  };

  const handleSave = () => {
    // Current backend endpoints only support GET.
    // Avoid claiming changes have been persisted.
    setSaved(false);
    setLoadError(
      "Settings are currently read-only on the server. Changes here are temporary and are not saved.",
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
        <div className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            View rate-limiting algorithms and system configuration
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-emerald-400">
            Settings saved successfully.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Supported Rate-Limiting Algorithms
        </h2>

        <p className="mb-5 text-sm text-slate-500">
          These are the algorithms implemented by GateKeeper. Their per-client
          limits are configured from the Clients page.
        </p>

        <div className="space-y-4">
          {rateLimits.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                  {item.algorithm}
                </span>
              </div>

              <h3 className="font-medium text-white">{item.name}</h3>

              <p className="mt-1 text-sm text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>

        {rateLimits.length === 0 && (
          <p className="text-sm text-slate-500">
            No rate-limiting algorithms were returned by the API.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">
          System Configuration
        </h2>

        <p className="mb-5 text-sm text-slate-500">
          Current configuration reported by the backend. Editing these fields
          does not reconfigure the running server.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="serviceName"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Service Name
            </label>
            <input
              id="serviceName"
              type="text"
              readOnly
              value={systemSettings.serviceName}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="environment"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Environment
            </label>
            <input
              id="environment"
              type="text"
              readOnly
              value={systemSettings.environment}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="serverPort"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Backend Port
            </label>
            <input
              id="serverPort"
              type="number"
              readOnly
              value={systemSettings.port}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="redisHost"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Redis Host
            </label>
            <input
              id="redisHost"
              type="text"
              readOnly
              value={systemSettings.redisHost}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="redisPort"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Redis Port
            </label>
            <input
              id="redisPort"
              type="number"
              readOnly
              value={systemSettings.redisPort}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="defaultAlgorithm"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Displayed Default Algorithm
            </label>
            <select
              id="defaultAlgorithm"
              value={systemSettings.defaultAlgorithm}
              onChange={(event) =>
                handleSystemChange("defaultAlgorithm", event.target.value)
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="token-bucket">Token Bucket</option>
              <option value="sliding-window-log">Sliding Window Log</option>
              <option value="sliding-window-counter">
                Sliding Window Counter
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
