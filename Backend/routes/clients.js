import express from "express";
import crypto from "crypto";
import redis from "../services/redisService.js";

const VALID_ALGORITHMS = [
  "token-bucket",
  "sliding-window-log",
  "sliding-window-counter",
];

const VALID_STATUSES = ["active", "disabled"];
const router = express.Router();

const CLIENT_PREFIX = "gatekeeper:client";
const CLIENT_INDEX = "gatekeeper:clients";
const API_KEY_INDEX = "gatekeeper:apikey";

function generateApiKey() {
  return `gk_live_${crypto.randomBytes(24).toString("hex")}`;
}

function clientKey(id) {
  return `${CLIENT_PREFIX}:${id}`;
}

// GET /api/clients
router.get("/", async (req, res) => {
  try {
    const ids = await redis.smembers(CLIENT_INDEX);

    if (!ids.length) {
      return res.json({
        success: true,
        clients: [],
        total: 0,
      });
    }

    const pipeline = redis.pipeline();

    ids.forEach((id) => {
      pipeline.hgetall(clientKey(id));
    });

    const results = await pipeline.exec();

    const clients = results
      .map(([error, client]) => {
        if (error || !client || !client.id) return null;

        return {
          ...client,
          limit: Number(client.limit),
          windowMs: Number(client.windowMs),
          refillRate: Number(client.refillRate),
          status: client.status || "active",
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error("GET /api/clients error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch clients",
    });
  }
});

// POST /api/clients
router.post("/", async (req, res) => {
  try {
    const {
      name,
      algorithm = "token-bucket",
      limit = 10,
      windowMs = 1000,
      refillRate = 1,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Client name is required",
      });
    }

    const validAlgorithms = [
      "token-bucket",
      "sliding-window-log",
      "sliding-window-counter",
    ];

    if (!validAlgorithms.includes(algorithm)) {
      return res.status(400).json({
        success: false,
        error: "Invalid rate limiting algorithm",
        allowedAlgorithms: validAlgorithms,
      });
    }
    if (!Number.isFinite(Number(limit)) || Number(limit) <= 0) {
      return res.status(400).json({
        success: false,
        error: "limit must be a positive number",
      });
    }

    if (!Number.isFinite(Number(windowMs)) || Number(windowMs) <= 0) {
      return res.status(400).json({
        success: false,
        error: "windowMs must be a positive number",
      });
    }

    if (!Number.isFinite(Number(refillRate)) || Number(refillRate) <= 0) {
      return res.status(400).json({
        success: false,
        error: "refillRate must be a positive number",
      });
    }
    const id = `client_${crypto.randomBytes(8).toString("hex")}`;
    const apiKey = generateApiKey();

    const client = {
      id,
      name,
      apiKey,
      algorithm,
      limit: String(limit),
      windowMs: String(windowMs),
      refillRate: String(refillRate),
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await redis.hset(clientKey(id), client);
    await redis.sadd(CLIENT_INDEX, id);
    await redis.set(`${API_KEY_INDEX}:${apiKey}`, id);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    console.error("POST /api/clients error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to create client",
    });
  }
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  try {
    const client = await redis.hgetall(clientKey(req.params.id));

    if (!client || !client.id) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    res.json({
      success: true,
      client: {
        ...client,
        limit: Number(client.limit),
        windowMs: Number(client.windowMs),
        refillRate: Number(client.refillRate),
      },
    });
  } catch (error) {
    console.error("GET /api/clients/:id error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch client",
    });
  }
});

// PUT /api/clients/:id
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await redis.hgetall(clientKey(id));

    if (!existing || !existing.id) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    const { name, algorithm, limit, windowMs, refillRate, status } = req.body;

    if (algorithm !== undefined && !VALID_ALGORITHMS.includes(algorithm)) {
      return res.status(400).json({
        success: false,
        error: "Invalid rate limiting algorithm",
        allowedAlgorithms: VALID_ALGORITHMS,
      });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid client status",
        allowedStatuses: VALID_STATUSES,
      });
    }

    if (
      limit !== undefined &&
      (!Number.isFinite(Number(limit)) || Number(limit) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "limit must be a positive number",
      });
    }

    if (
      windowMs !== undefined &&
      (!Number.isFinite(Number(windowMs)) || Number(windowMs) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "windowMs must be a positive number",
      });
    }
    if (
      refillRate !== undefined &&
      (!Number.isFinite(Number(refillRate)) || Number(refillRate) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "refillRate must be a positive number",
      });
    }
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (algorithm !== undefined) updates.algorithm = algorithm;
    if (limit !== undefined) updates.limit = String(limit);
    if (windowMs !== undefined) updates.windowMs = String(windowMs);
    if (status !== undefined) updates.status = status;
    if (refillRate !== undefined) {
      updates.refillRate = String(refillRate);
    }
    if (Object.keys(updates).length > 0) {
      await redis.hset(clientKey(id), updates);
    }
    
    const updated = await redis.hgetall(clientKey(id));

    res.json({
      success: true,
      message: "Client updated successfully",
      client: {
        ...updated,
        limit: Number(updated.limit),
        windowMs: Number(updated.windowMs),
        refillRate: Number(updated.refillRate),
      },
    });
  } catch (error) {
    console.error("PUT /api/clients/:id error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to update client",
    });
  }
});

// DELETE /api/clients/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const exists = await redis.exists(clientKey(id));

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: "Client not found",
      });
    }

    const client = await redis.hgetall(clientKey(id));

    await redis.del(clientKey(id));
    await redis.srem(CLIENT_INDEX, id);

    if (client.apiKey) {
      await redis.del(`gatekeeper:apikey:${client.apiKey}`);
    }

    res.json({
      success: true,
      message: "Client deleted successfully",
      id,
    });
  } catch (error) {
    console.error("DELETE /api/clients/:id error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to delete client",
    });
  }
});

export default router;
