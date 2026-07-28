import express from "express";
import redis from "../services/redisService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  await redis.set("test-key", "GateKeeper");

  const value = await redis.get("test-key");

  res.json({
    key: "test-key",
    value,
  });
});

export default router;
