import { tokenBucket } from "../services/tokenBucket.js";
import { slidingWindowLog } from "../services/slidingWindowLog.js";
import { slidingWindowCounter } from "../services/slidingWindowCounter.js";

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
    try {
      const clientId = req.headers["x-api-key"] || req.ip || "anonymous";

      const key = `${keyPrefix}:${algorithm}:${clientId}`;

      let result;

      // -----------------------------
      // Token Bucket
      // -----------------------------

      if (algorithm === "token-bucket") {
        result = await tokenBucket({
          key,
          capacity,
          refillRate,
          requested: 1,
        });
      }

      // -----------------------------
      // Sliding Window Log
      // -----------------------------
      else if (algorithm === "sliding-window-log") {
        result = await slidingWindowLog({
          key,
          limit,
          windowMs,
          requested: 1,
        });
      }

      // -----------------------------
      // Sliding Window Counter
      // -----------------------------
      else if (algorithm === "sliding-window-counter") {
        result = await slidingWindowCounter({
          key,
          limit,
          windowMs,
          requested: 1,
        });
      } else {
        return res.status(500).json({
          error: "Invalid rate limiting algorithm",
          algorithm,
        });
      }

      // -----------------------------
      // Rate Limit Headers
      // -----------------------------

      res.setHeader("X-RateLimit-Limit", result.limit);

      res.setHeader("X-RateLimit-Remaining", result.remaining);

      res.setHeader("X-RateLimit-Algorithm", algorithm);

      // -----------------------------
      // Block request
      // -----------------------------

      if (!result.allowed) {
        res.setHeader("Retry-After", "1");

        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded",
          algorithm,
          limit: result.limit,
          remaining: result.remaining,
        });
      }

      // -----------------------------
      // Allow request
      // -----------------------------

      next();
    } catch (error) {
      console.error("Rate limiter error:", error);

      return res.status(503).json({
        error: "Rate limiter unavailable",
        message: "Unable to verify rate limit",
      });
    }
  };
}
