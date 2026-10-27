import express from "express";
import { randomUUID } from "node:crypto";
import redis from "../services/redisService.js";

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

  const requestCount = firstNumber(requests.count);
  const requestsPerSecond = firstNumber(requests.rate);

  const p50 = firstNumber(duration.med, duration.avg);
  const p95 = firstNumber(duration["p(95)"]);
  const p99 = firstNumber(duration["p(99)"]);

  // Generic k6 output does not provide memory usage or rate-limit
  // rejection accuracy. Do not invent those measurements.
  const memoryUsage = 0;
  const rejectionAccuracy = 0;

  return {
    id: randomUUID(),
    algorithm: "k6 load test",
    throughput: requestsPerSecond,
    requests_per_sec: requestsPerSecond,
    total_requests: requestCount,
    p50,
    p95,
    p99,
    memory_usage: memoryUsage,
    rejection_accuracy: rejectionAccuracy,
    checks_passed: firstNumber(checks.passes),
    checks_failed: firstNumber(checks.fails),
    source: "k6",
    created_at: new Date().toISOString(),
  };
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
        : "No benchmark results available yet. Import a k6 JSON summary to get started.",
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
    const { action, data } = req.body ?? {};

    if (action !== "import_k6") {
      return res.status(400).json({
        success: false,
        message: "Unsupported action. Use action: 'import_k6'.",
      });
    }

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
  } catch (error) {
    console.error("Import benchmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save benchmark results.",
    });
  }
});

export default router;
