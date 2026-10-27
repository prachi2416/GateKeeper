import express from "express";
import redis from "../services/redisService.js";

const router = express.Router();

const METRICS_KEY = "gatekeeper:metrics";
const ACTIVE_CLIENTS_KEY = "gatekeeper:metrics:active-clients";

router.get("/", async (req, res) => {
  try {
    const metrics = await redis.hgetall(METRICS_KEY);

    const totalRequests = Number(metrics.totalRequests || 0);
    const allowedRequests = Number(metrics.allowedRequests || 0);
    const blockedRequests = Number(metrics.blockedRequests || 0);
    const totalLatency = Number(metrics.totalLatency || 0);

    const averageLatency =
      totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

    const successRate =
      totalRequests > 0
        ? Number(((allowedRequests / totalRequests) * 100).toFixed(2))
        : 0;

    const activeClients = await redis.scard(ACTIVE_CLIENTS_KEY);

    res.json({
      success: true,
      totalRequests,
      allowedRequests,
      blockedRequests,
      successRate,
      averageLatency,
      activeClients,
    });
  } catch (error) {
    console.error("Metrics error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve metrics",
    });
  }
});

export default router;
