import { useEffect, useState, useCallback } from "react";
import {
  Upload,
  BarChart3,
  MemoryStick,
  Gauge,
  Target,
  Zap,
  Play,
  RefreshCw,
} from "lucide-react";
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
} from "recharts";

interface Benchmark {
  id: string | number;
  algorithm: string;
  throughput: number;
  requests_per_sec: number;
  total_requests?: number;
  p50: number;
  p95: number;
  p99: number;
  memory_usage: number;
  rejection_accuracy: number;
  created_at: string;
  source?: string;
}

const API_URL = "/api/benchmarks";

const formatNumber = (value: number | undefined, decimals = 2) =>
  Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });

const formatTime = (value: string) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export default function Benchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchBenchmarks = useCallback(async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch benchmarks.");
      }

      const results = Array.isArray(data)
        ? data
        : Array.isArray(data.benchmarks)
          ? data.benchmarks
          : [];

      setBenchmarks(results);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load benchmark results.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBenchmarks();
  }, [fetchBenchmarks]);

  const handleRunBenchmark = async () => {
    setRunning(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "run",
          iterations: 200,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Benchmark run failed.");
      }

      await fetchBenchmarks();
      setNotice(
        data.message || "Benchmark completed. Results have been saved.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to run benchmarks.",
      );
    } finally {
      setRunning(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError("");
    setNotice("");

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "import_k6",
          data: json,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to import k6 results.");
      }

      await fetchBenchmarks();
      setNotice(data.message || "k6 results imported successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import the JSON file.",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  
const latestByAlgorithm = new Map<string, Benchmark>();

for (const benchmark of benchmarks) {
  const existing = latestByAlgorithm.get(benchmark.algorithm);

  if (
    !existing ||
    new Date(benchmark.created_at).getTime() >
      new Date(existing.created_at).getTime()
  ) {
    latestByAlgorithm.set(benchmark.algorithm, benchmark);
  }
}

const latestBenchmarks = Array.from(latestByAlgorithm.values());

const chartData = latestBenchmarks.map((benchmark, index) => ({
  id: String(benchmark.id ?? index),
  name: benchmark.algorithm,
  throughput: Number(benchmark.throughput ?? 0),
  requests_per_sec: Number(benchmark.requests_per_sec ?? 0),
  p50: Number(benchmark.p50 ?? 0),
  p95: Number(benchmark.p95 ?? 0),
  p99: Number(benchmark.p99 ?? 0),
  memory: Number(benchmark.memory_usage ?? 0),
  accuracy: Number(benchmark.rejection_accuracy ?? 0),
}));


  const metrics = [
    {
      label: "Throughput",
      key: "throughput",
      unit: " req/s",
      icon: Zap,
      color: "#10b981",
      decimals: 2,
    },
    {
      label: "p50 Latency",
      key: "p50",
      unit: " ms",
      icon: Gauge,
      color: "#6366f1",
      decimals: 3,
    },
    {
      label: "p95 Latency",
      key: "p95",
      unit: " ms",
      icon: Gauge,
      color: "#f59e0b",
      decimals: 3,
    },
    {
      label: "p99 Latency",
      key: "p99",
      unit: " ms",
      icon: Gauge,
      color: "#ef4444",
      decimals: 3,
    },
    {
      label: "Memory",
      key: "memory",
      unit: " MB",
      icon: MemoryStick,
      color: "#a855f7",
      decimals: 6,
    },
    {
      label: "Accuracy",
      key: "accuracy",
      unit: "%",
      icon: Target,
      color: "#10b981",
      decimals: 2,
    },
  ] as const;

  const chartTooltipStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "8px",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Benchmark Results</h1>
          <p className="mt-1 text-sm text-slate-500">
            Rate limiting algorithm performance comparison
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={running || importing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            {running ? "Running benchmarks..." : "Run Benchmark"}
          </button>

          <label
            className={`inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-300 transition-colors ${
              importing || running
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-slate-700"
            }`}
          >
            <Upload size={16} />
            {importing ? "Importing..." : "Import k6 JSON"}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
              disabled={importing || running}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Run Benchmark executes 200 requests per algorithm. Results are saved by
        the backend in Redis.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const key = metric.key as keyof (typeof chartData)[number];

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <Icon size={14} style={{ color: metric.color }} />
                <span className="text-xs text-slate-500">{metric.label}</span>
              </div>

              {loading ? (
                <div className="h-8 animate-pulse rounded bg-slate-800" />
              ) : chartData.length === 0 ? (
                <p className="text-sm text-slate-500">No results yet</p>
              ) : (
                <div className="space-y-2">
                  {chartData.map((item) => (
                    <div
                      key={`${metric.label}-${item.id}`}
                      className="flex items-start justify-between gap-2"
                    >
                      <span className="break-words text-xs text-slate-400">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-slate-200">
                        {formatNumber(Number(item[key]), metric.decimals)}
                        {metric.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <BarChart3 size={14} />
            Throughput Comparison
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={55}
              />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [
                  `${formatNumber(Number(value))} req/s`,
                  "Throughput",
                ]}
              />
              <Bar
                dataKey="throughput"
                name="Requests/sec"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Gauge size={14} />
            Latency Comparison (p50/p95/p99)
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [`${formatNumber(Number(value), 3)} ms`]}
              />
              <Legend />
              <Bar dataKey="p50" name="p50" fill="#10b981" />
              <Bar dataKey="p95" name="p95" fill="#f59e0b" />
              <Bar dataKey="p99" name="p99" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <MemoryStick size={14} />
            Memory Usage Comparison
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [
                  `${formatNumber(Number(value), 6)} MB`,
                  "Redis key memory (approx.)",
                ]}
              />
              <Bar
                dataKey="memory"
                name="Memory (MB)"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-500">
            Approximate Redis key memory, not total process memory.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Target size={14} />
            Rejection Accuracy
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [
                  `${formatNumber(Number(value))}%`,
                  "Decision accuracy",
                ]}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                name="Decision accuracy"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-500">
            Accuracy reflects the current benchmark's expected decision pattern,
            not exhaustive correctness testing.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">
            Benchmark Data Table
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {[
                  "Algorithm",
                  "Throughput",
                  "Req/s",
                  "p50",
                  "p95",
                  "p99",
                  "Memory",
                  "Accuracy",
                  "Run time",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-5 py-3 text-left font-medium text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    Loading benchmark results...
                  </td>
                </tr>
              ) : benchmarks.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    No benchmark results yet. Click Run Benchmark to start.
                  </td>
                </tr>
              ) : (
                benchmarks.map((benchmark) => (
                  <tr
                    key={benchmark.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3 font-medium text-slate-300">
                      {benchmark.algorithm}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-300">
                      {formatNumber(benchmark.throughput)} req/s
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-300">
                      {formatNumber(benchmark.requests_per_sec)} req/s
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-emerald-400">
                      {formatNumber(benchmark.p50, 3)} ms
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-amber-400">
                      {formatNumber(benchmark.p95, 3)} ms
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-red-400">
                      {formatNumber(benchmark.p99, 3)} ms
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-purple-400">
                      {formatNumber(benchmark.memory_usage, 6)} MB
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-emerald-400">
                      {formatNumber(benchmark.rejection_accuracy)}%
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-400">
                      {formatTime(benchmark.created_at)}
                    </td>
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
