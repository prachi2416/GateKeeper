import { useEffect, useState } from 'react';
import { Server, Database, ArrowRight, Activity, Globe, Shield } from 'lucide-react';

interface GatewayInstance {
  id: number;
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

  useEffect(() => {
    fetch('/api/gateway-instances')
      .then((res) => res.json())
      .then((data) => {
        setInstances(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getHealthText = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'offline': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gateway Instances</h1>
        <p className="text-slate-500 text-sm mt-1">Distributed gateway architecture and health status</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h3 className="text-sm font-semibold text-white mb-6 text-center">Architecture Overview</h3>

        <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-white">Load Balancer</p>
              <p className="text-xs text-slate-500">Round-robin distribution</p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">Active</span>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
              ))
            ) : (
              instances.map((instance) => (
                <div
                  key={instance.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">{instance.name}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getHealthColor(instance.health_status)}`} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Region</span>
                      <span className="text-slate-300">{instance.region}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">CPU</span>
                      <span className="text-slate-300">{instance.cpu_usage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Memory</span>
                      <span className="text-slate-300">{instance.memory_usage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Requests</span>
                      <span className="text-slate-300">{instance.requests_handled?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className={`text-xs font-medium capitalize ${getHealthText(instance.health_status)}`}>
                      {instance.health_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="flex items-center gap-4 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Database className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">Shared Redis Cluster</p>
              <p className="text-xs text-slate-500">3-node cluster with replication</p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">Connected</span>
            </div>
          </div>

          <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />

          <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">Backend Services</p>
              <p className="text-xs text-slate-500">Upstream API pool</p>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400">Healthy</span>
            </div>
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
              <p className="text-xl font-bold text-white">{instances.length || 3}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">All operational</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Redis Nodes</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Cluster healthy</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Regions</p>
              <p className="text-xl font-bold text-white">3</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">US-East, US-West, EU-Central</span>
          </div>
        </div>
      </div>
    </div>
  );
}
