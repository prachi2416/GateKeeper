import express from "express";
import { randomUUID } from "node:crypto";
import redis from "../services/redisService.js";

import { tokenBucket } from "../services/tokenBucket.js";
import { slidingWindowLog } from "../services/slidingWindowLog.js";
import { slidingWindowCounter } from "../services/slidingWindowCounter.js";

const router = express.Router();

const BENCHMARKS_KEY = "gatekeeper:benchmarks";
const MAX_RESULTS = 100;

function parseStoredResult(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getMetricValues(metrics, name) {
  return metrics?.[name]?.values ?? {};
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      Number.isFinite(number)
    ) {
      return number;
    }
  }
  return 0;
}

function normalizeK6Result(data) {
  const root = data?.data ?? data;
  const metrics = root?.metrics ?? root?.root_group?.metrics;

  if (!metrics || typeof metrics !== "object") {
    throw new Error(
      "Unsupported k6 JSON. Expected a k6 summary containing a metrics object.",
    );
  }

  const requests = getMetricValues(metrics, "http_reqs");
  const duration = getMetricValues(metrics, "http_req_duration");
  const checks = getMetricValues(metrics, "checks");

  const requestsPerSecond = firstNumber(requests.rate);

  return {
    id: randomUUID(),
    algorithm: "k6 load test",
    throughput: requestsPerSecond,
    requests_per_sec: requestsPerSecond,
    total_requests: firstNumber(requests.count),
    p50: firstNumber(duration.med, duration.avg),
    p95: firstNumber(duration["p(95)"]),
    p99: firstNumber(duration["p(99)"]),
    memory_usage: 0,
    rejection_accuracy: 0,
    checks_passed: firstNumber(checks.passes),
    checks_failed: firstNumber(checks.fails),
    source: "k6",
    created_at: new Date().toISOString(),
  };
}

function percentile(sorted, percent) {
  if (!sorted.length) return 0;
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(3));
}

async function runAlgorithmBenchmark(algorithm, iterations = 200) {
  const id = randomUUID();
  const key = `gatekeeper:benchmark-run:${id}`;
  const limit = Math.floor(iterations / 2);
  const windowMs = 60000;

  const latencies = [];
  let allowed = 0;
  let correctDecisions = 0;

  const startedAt = performance.now();

  try {
    for (let i = 0; i < iterations; i++) {
      const requestStarted = performance.now();
      let result;

      if (algorithm === "token-bucket") {
        result = await tokenBucket({
          key,
          capacity: limit,
          refillRate: 0.000001,
          requested: 1,
        });
      } else if (algorithm === "sliding-window-log") {
        result = await slidingWindowLog({
          key,
          limit,
          windowMs,
          requested: 1,
        });
      } else {
        result = await slidingWindowCounter({
          key,
          limit,
          windowMs,
          requested: 1,
        });
      }

      latencies.push(performance.now() - requestStarted);

      if (result.allowed) allowed++;

      // Expected behavior: allow the first `limit` requests,
      // reject subsequent requests while the test window is active.
      const expectedAllowed = i < limit;
      if (result.allowed === expectedAllowed) correctDecisions++;
    }

    const elapsedMs = performance.now() - startedAt;
    const sorted = [...latencies].sort((a, b) => a - b);

    let memoryUsage = 0;

    try {
      const usage = await redis.memory("USAGE", key);
      memoryUsage = usage == null ? 0 : Number(usage) / (1024 * 1024);
    } catch {
      // MEMORY USAGE is approximate and may not be supported by every
      // Redis version/configuration.
    }

    return {
      id: randomUUID(),
      algorithm,
      iterations,
      total_requests: iterations,
      allowed_requests: allowed,
      rejected_requests: iterations - allowed,
      throughput: Number((iterations / (elapsedMs / 1000)).toFixed(2)),
      requests_per_sec: Number((iterations / (elapsedMs / 1000)).toFixed(2)),
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      memory_usage: Number(memoryUsage.toFixed(6)),
      rejection_accuracy: Number(
        ((correctDecisions / iterations) * 100).toFixed(2),
      ),
      duration_ms: Number(elapsedMs.toFixed(2)),
      source: "gatekeeper-benchmark",
      created_at: new Date().toISOString(),
    };
  } finally {
    // Remove only keys created for this isolated benchmark.
    const currentWindow = Math.floor(Date.now() / windowMs);
    await redis.del(
      key,
      `${key}:sequence`,
      `${key}:${currentWindow}`,
      `${key}:${currentWindow - 1}`,
    );
  }
}

router.get("/", async (req, res) => {
  try {
    const values = await redis.lrange(BENCHMARKS_KEY, 0, MAX_RESULTS - 1);
    const benchmarks = values.map(parseStoredResult).filter(Boolean);

    res.json({
      success: true,
      benchmarks,
      message: benchmarks.length
        ? "Benchmark results retrieved."
        : "No benchmark results available yet.",
    });
  } catch (error) {
    console.error("Fetch benchmarks error:", error);
    res.status(500).json({
      success: false,
      benchmarks: [],
      message: "Failed to fetch benchmark results.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { action, data, iterations: requestedIterations } = req.body ?? {};

    if (action === "run") {
      const iterations = Number(requestedIterations ?? 200);

      if (
        !Number.isInteger(iterations) ||
        iterations < 20 ||
        iterations > 1000
      ) {
        return res.status(400).json({
          success: false,
          message: "iterations must be an integer between 20 and 1000.",
        });
      }

      const results = [];

      for (const algorithm of [
        "token-bucket",
        "sliding-window-log",
        "sliding-window-counter",
      ]) {
        results.push(await runAlgorithmBenchmark(algorithm, iterations));
      }

      const pipeline = redis.pipeline();

      for (const result of results) {
        pipeline.lpush(BENCHMARKS_KEY, JSON.stringify(result));
      }

      pipeline.ltrim(BENCHMARKS_KEY, 0, MAX_RESULTS - 1);
      await pipeline.exec();

      return res.status(201).json({
        success: true,
        benchmarks: results,
        message: "Benchmark run completed.",
      });
    }

    if (action === "import_k6") {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid k6 JSON object.",
        });
      }

      let benchmark;

      try {
        benchmark = normalizeK6Result(data);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      await redis.lpush(BENCHMARKS_KEY, JSON.stringify(benchmark));
      await redis.ltrim(BENCHMARKS_KEY, 0, MAX_RESULTS - 1);

      return res.status(201).json({
        success: true,
        benchmark,
        message: "k6 benchmark result imported successfully.",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported action. Use 'run' or 'import_k6'.",
    });
  } catch (error) {
    console.error("Benchmark operation error:", error);

    res.status(500).json({
      success: false,
      message: "Benchmark operation failed.",
    });
  }
});

export default router;
