import { useEffect, useState } from "react";
import {
  Server,
  Database,
  ArrowRight,
  Activity,
  Globe,
  Shield,
} from "lucide-react";

interface GatewayInstance {
  id: number | string;
  name: string;
  region: string;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  requests_handled: number;
  health_status: string;
}

export default function GatewayInstances() {
  const [instances, setInstances] = useState<GatewayInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const fetchInstances = async () => {
      try {
        setFetchError("");

        const response = await fetch("/api/gateway-instances");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch gateway instances");
        }

        const instanceList = Array.isArray(data)
          ? data
          : Array.isArray(data?.instances)
            ? data.instances
            : [];

        setInstances(instanceList);
      } catch (error) {
        console.error("Gateway instances fetch error:", error);
        setInstances([]);
        setFetchError("Unable to load gateway instances.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();
  }, []);

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getHealthText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "offline":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gateway Instances</h1>
        <p className="text-slate-500 text-sm mt-1">
          Gateway architecture and registered instance status
        </p>
      </div>

      {fetchError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {fetchError} Check that the backend is running and the gateway
          instances endpoint is registered.
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h3 className="text-sm font-semibold text-white mb-6 text-center">
          Architecture Overview
        </h3>

        <div className="flex flex-col items-center gap-5 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl w-full max-w-sm">
            <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">API Entry Point</p>
              <p className="text-xs text-slate-500">Incoming client requests</p>
            </div>
            <span className="text-xs text-slate-400">Configured</span>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="w-full">
            <p className="text-center text-xs text-slate-500 mb-3">
              Registered gateway instances
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-32 bg-slate-800/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : instances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
                <Server className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-300">
                  No gateway instances registered
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Instances will appear here when they are registered with the
                  backend.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances.map((instance) => (
                  <div
                    key={instance.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Server className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-white truncate">
                          {instance.name}
                        </span>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${getHealthColor(instance.health_status)}`}
                        title={instance.health_status || "Unknown"}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500">Region</span>
                        <span className="text-slate-300">
                          {instance.region || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">CPU</span>
                        <span className="text-slate-300">
                          {instance.cpu_usage ?? "—"}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Memory</span>
                        <span className="text-slate-300">
                          {instance.memory_usage ?? "—"}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Requests</span>
                        <span className="text-slate-300">
                          {instance.requests_handled?.toLocaleString() ?? "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <span
                        className={`text-xs font-medium capitalize ${getHealthText(instance.health_status)}`}
                      >
                        {instance.health_status || "Status unknown"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="flex items-center gap-4 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl w-full max-w-sm">
            <Database className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Redis</p>
              <p className="text-xs text-slate-500">
                Shared rate-limit data store
              </p>
            </div>
            <span className="text-xs text-slate-400">Local setup</span>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-full max-w-sm">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Backend Services</p>
              <p className="text-xs text-slate-500">
                API gateway and rate-limiting logic
              </p>
            </div>
            <span className="text-xs text-slate-400">API service</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Instances</p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : instances.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {loading
              ? "Loading instances"
              : instances.length === 0
                ? "No instances registered"
                : `${instances.length} registered instance${instances.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Redis Setup</p>
              <p className="text-xl font-bold text-white">1</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Local Redis container configured
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Regions</p>
              <p className="text-xl font-bold text-white">0</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">No regions configured</p>
        </div>
      </div>
    </div>
  );
}
