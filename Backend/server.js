import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import redis from "./services/redisService.js";
import { connectRedis } from "./services/redisService.js";

import healthRoutes from "./routes/health.js";
import clientsRoutes from "./routes/clients.js";
import metricsRoutes from "./routes/metrics.js";
import proxyRoutes from "./routes/proxy.js";
import adminRoutes from "./routes/admin.js";
import notificationsRoutes from "./routes/notifications.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import benchmarksRoutes from "./routes/benchmarks.js";
import gatewayInstancesRoutes from "./routes/gatewayInstances.js";
import settingsRoutes from "./routes/settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------------
// Global middleware
// ------------------------------------

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

// ------------------------------------
// API routes
// ------------------------------------
app.use("/api/notifications", notificationsRoutes);
app.use("/api/health", healthRoutes);
app.get(
  "/api/test",
  rateLimiter({
    capacity: 5,
    refillRate: 0.1,
    keyPrefix: "gatekeeper:test",
  }),
  (req, res) => {
    res.json({
      success: true,
      message: "Request allowed by GateKeeper",
      timestamp: new Date().toISOString(),
    });
  },
);
app.use("/api/clients", clientsRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/proxy", proxyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/benchmarks", benchmarksRoutes);
app.use("/api/gateway-instances", gatewayInstancesRoutes);
app.use("/api", settingsRoutes);
// ------------------------------------
// Request logs
// ------------------------------------

app.get("/api/request-logs", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const rawLogs = await redis.lrange("gatekeeper:request-logs", 0, limit - 1);

    const logs = rawLogs
      .map((log) => {
        try {
          return JSON.parse(log);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    res.json({
      success: true,
      logs,
      limit,
    });
  } catch (error) {
    console.error("Request logs error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve request logs",
    });
  }
});

// ------------------------------------
// Root endpoint
// ------------------------------------

app.get("/", (req, res) => {
  res.json({
    service: "GateKeeper Backend",
    version: "1.0.0",
    status: "Running",
  });
});

// ------------------------------------
// 404 handler
// ------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ------------------------------------
// Start server
// ------------------------------------

async function startServer() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
