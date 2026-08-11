import { tokenBucket } from "../services/tokenBucket.js";
import { slidingWindowLog } from "../services/slidingWindowLog.js";
import { slidingWindowCounter } from "../services/slidingWindowCounter.js";
import { getClientByApiKey } from "../services/clientService.js";

export function rateLimiter(options = {}) {
  const {
    keyPrefix = "gatekeeper:ratelimit",

    // Fallback values
    capacity = 10,
    refillRate = 1,
    limit = 10,
    windowMs = 1000,
  } = options;

  return async (req, res, next) => {
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
      // 4. Get client's configuration
      // ------------------------------------

      const algorithm = client.algorithm || "token-bucket";

      const clientLimit =
        Number(client.limit) > 0 ? Number(client.limit) : limit;

      const clientWindowMs =
        Number(client.windowMs) > 0 ? Number(client.windowMs) : windowMs;

      // Token bucket refill rate:
      //
      // Example:
      // limit = 5
      // windowMs = 1000
      //
      // => 5 tokens per second

      const clientRefillRate = clientLimit / (clientWindowMs / 1000);

      // ------------------------------------
      // 5. Redis rate-limit key
      // ------------------------------------

      const key = `${keyPrefix}:${algorithm}:${client.id}`;

      let result;

      // ------------------------------------
      // 6. Token Bucket
      // ------------------------------------

      if (algorithm === "token-bucket") {
        result = await tokenBucket({
          key,
          capacity: clientLimit,
          refillRate: clientRefillRate,
          requested: 1,
        });
      }

      // ------------------------------------
      // 7. Sliding Window Log
      // ------------------------------------
      else if (algorithm === "sliding-window-log") {
        result = await slidingWindowLog({
          key,
          limit: clientLimit,
          windowMs: clientWindowMs,
          requested: 1,
        });
      }

      // ------------------------------------
      // 8. Sliding Window Counter
      // ------------------------------------
      else if (algorithm === "sliding-window-counter") {
        result = await slidingWindowCounter({
          key,
          limit: clientLimit,
          windowMs: clientWindowMs,
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
          algorithm,
        });
      }

      // ------------------------------------
      // 10. Rate-limit headers
      // ------------------------------------

      res.setHeader("X-RateLimit-Limit", result.limit);

      res.setHeader("X-RateLimit-Remaining", result.remaining);

      res.setHeader("X-RateLimit-Algorithm", algorithm);

      res.setHeader("X-RateLimit-Client", client.id);

      // ------------------------------------
      // 11. Request blocked
      // ------------------------------------

      if (!result.allowed) {
        res.setHeader("Retry-After", "1");

        return res.status(429).json({
          success: false,
          error: "Too Many Requests",
          message: "Rate limit exceeded",
          algorithm,
          limit: result.limit,
          remaining: result.remaining,
        });
      }

      // ------------------------------------
      // 12. Request allowed
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
