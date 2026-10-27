import { tokenBucket } from "../services/tokenBucket.js";
import { slidingWindowLog } from "../services/slidingWindowLog.js";
import { slidingWindowCounter } from "../services/slidingWindowCounter.js";
import { getClientByApiKey } from "../services/clientService.js";
import redis from "../services/redisService.js";

const METRICS_KEY = "gatekeeper:metrics";
const ACTIVE_CLIENTS_KEY = "gatekeeper:metrics:active-clients";
const REQUEST_LOGS_KEY = "gatekeeper:request-logs";

async function recordMetric({
  client,
  algorithm,
  allowed,
  latency,
  statusCode,
  req,
}) {
  try {
    await redis.hincrby(METRICS_KEY, "totalRequests", 1);

    if (allowed) {
      await redis.hincrby(METRICS_KEY, "allowedRequests", 1);
    } else {
      await redis.hincrby(METRICS_KEY, "blockedRequests", 1);
    }

    await redis.hincrby(
      METRICS_KEY,
      "totalLatency",
      Math.max(0, Math.round(latency)),
    );

    await redis.sadd(ACTIVE_CLIENTS_KEY, client.id);

    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      clientId: client.id,
      clientName: client.name,
      algorithm,
      allowed,
      statusCode,
      latency: Math.round(latency),
    };

    await redis.lpush(REQUEST_LOGS_KEY, JSON.stringify(log));
    await redis.ltrim(REQUEST_LOGS_KEY, 0, 99);
  } catch (error) {
    // Metrics must never break the actual API request.
    console.error("Metrics recording error:", error);
  }
}

export function rateLimiter(options = {}) {
  const {
    algorithm = "token-bucket",

    capacity = 10,
    refillRate = 1,

    limit = 10,
    windowMs = 1000,

    keyPrefix = "gatekeeper:ratelimit",
  } = options;

  return async (req, res, next) => {
    const requestStart = Date.now();

    try {
      // ------------------------------------
      // 1. Get API key
      // ------------------------------------

      const apiKey = req.headers["x-api-key"];

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: "API key required",
          message: "Provide an X-API-Key header",
        });
      }

      // ------------------------------------
      // 2. Find client
      // ------------------------------------

      const client = await getClientByApiKey(apiKey);

      if (!client) {
        return res.status(401).json({
          success: false,
          error: "Invalid API key",
          message: "The provided API key is not associated with a client",
        });
      }

      // ------------------------------------
      // 3. Check client status
      // ------------------------------------

      if (client.status !== "active") {
        return res.status(403).json({
          success: false,
          error: "Client disabled",
          message: "This API client is currently disabled",
        });
      }

      // ------------------------------------
      // 4. Use client's configuration
      // ------------------------------------

      const selectedAlgorithm = client.algorithm || algorithm;

      const selectedLimit = Number.isFinite(Number(client.limit))
        ? Number(client.limit)
        : limit;

      const selectedWindowMs = Number.isFinite(Number(client.windowMs))
        ? Number(client.windowMs)
        : windowMs;

      const selectedRefillRate =
        client.refillRate !== null &&
        client.refillRate !== undefined &&
        Number.isFinite(Number(client.refillRate))
          ? Number(client.refillRate)
          : refillRate;

      // ------------------------------------
      // 5. Redis key
      // ------------------------------------

      const key = `${keyPrefix}:${selectedAlgorithm}:${client.id}`;

      let result;

      // ------------------------------------
      // 6. Token Bucket
      // ------------------------------------

      if (selectedAlgorithm === "token-bucket") {
        result = await tokenBucket({
          key,
          capacity: selectedLimit,
          refillRate: selectedRefillRate,
          requested: 1,
        });
      }

      // ------------------------------------
      // 7. Sliding Window Log
      // ------------------------------------
      else if (selectedAlgorithm === "sliding-window-log") {
        result = await slidingWindowLog({
          key,
          limit: selectedLimit,
          windowMs: selectedWindowMs,
          requested: 1,
        });
      }

      // ------------------------------------
      // 8. Sliding Window Counter
      // ------------------------------------
      else if (selectedAlgorithm === "sliding-window-counter") {
        result = await slidingWindowCounter({
          key,
          limit: selectedLimit,
          windowMs: selectedWindowMs,
          requested: 1,
        });
      }

      // ------------------------------------
      // 9. Invalid algorithm
      // ------------------------------------
      else {
        return res.status(500).json({
          success: false,
          error: "Invalid rate limiting algorithm",
          algorithm: selectedAlgorithm,
        });
      }

      // ------------------------------------
      // 10. Rate limit headers
      // ------------------------------------

      res.setHeader("X-RateLimit-Limit", result.limit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Algorithm", selectedAlgorithm);

      const latency = Date.now() - requestStart;

      // ------------------------------------
      // 11. Block request
      // ------------------------------------

      if (!result.allowed) {
        res.setHeader("Retry-After", "1");

        await recordMetric({
          client,
          algorithm: selectedAlgorithm,
          allowed: false,
          latency: Date.now() - requestStart,
          statusCode: 429,
          req,
        });

        return res.status(429).json({
          success: false,
          error: "Too Many Requests",
          message: "Rate limit exceeded",
          algorithm: selectedAlgorithm,
          limit: result.limit,
          remaining: result.remaining,
        });
      }

      // ------------------------------------
      // 12. Record allowed request
      // ------------------------------------

      await recordMetric({
        client,
        algorithm: selectedAlgorithm,
        allowed: true,
        latency,
        statusCode: 200,
        req,
      });

      // ------------------------------------
      // 13. Continue
      // ------------------------------------

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);

      return res.status(503).json({
        success: false,
        error: "Rate limiter unavailable",
        message: "Unable to verify rate limit",
      });
    }
  };
}
