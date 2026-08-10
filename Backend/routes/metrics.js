import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    success: true,
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    successRate: 0,
    averageLatency: 0,
    activeClients: 0,
  });
});

export default router;
