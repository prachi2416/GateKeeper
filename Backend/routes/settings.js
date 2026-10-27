import express from "express";
const router = express.Router();

// Current supported rate-limiting configurations
router.get("/rate-limits", (req, res) => {
  res.json({
    success: true,
    rateLimits: [
      {
        id: "token-bucket",
        name: "Token Bucket",
        algorithm: "token-bucket",
        description:
          "Allows bursts and replenishes tokens at a configured rate.",
      },
      {
        id: "sliding-window-log",
        name: "Sliding Window Log",
        algorithm: "sliding-window-log",
        description: "Tracks request timestamps within a rolling time window.",
      },
      {
        id: "sliding-window-counter",
        name: "Sliding Window Counter",
        algorithm: "sliding-window-counter",
        description:
          "Estimates rolling-window usage using adjacent window counts.",
      },
    ],
  });
});

// Default system settings; these are informational defaults for now.
router.get("/system-settings", (req, res) => {
  res.json({
    success: true,
    settings: {
      serviceName: "GateKeeper",
      environment: process.env.NODE_ENV || "development",
      port: Number(process.env.PORT || 5000),
      redisHost: process.env.REDIS_HOST || "127.0.0.1",
      redisPort: Number(process.env.REDIS_PORT || 6379),
    },
  });
});

export default router;
