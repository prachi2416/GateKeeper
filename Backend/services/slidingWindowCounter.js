import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import redis from "./redisService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const luaPath = path.join(__dirname, "../lua/slidingWindowCounter.lua");

const slidingWindowCounterScript = fs.readFileSync(luaPath, "utf8");

let scriptSha = null;

async function loadScript() {
  if (!scriptSha) {
    scriptSha = await redis.script("LOAD", slidingWindowCounterScript);
  }

  return scriptSha;
}

export async function slidingWindowCounter({
  key,
  limit = 10,
  windowMs = 1000,
  requested = 1,
}) {
  const now = Date.now();

  const sha = await loadScript();

  try {
    const result = await redis.evalsha(
      sha,
      1,
      key,
      limit,
      windowMs,
      requested,
      now,
    );

    return {
      allowed: Number(result[0]) === 1,
      remaining: Number(result[1]),
      limit: Number(result[2]),
      currentCount: Number(result[3]),
    };
  } catch (error) {
    if (error.message.includes("NOSCRIPT")) {
      scriptSha = null;

      const newSha = await loadScript();

      const result = await redis.evalsha(
        newSha,
        1,
        key,
        limit,
        windowMs,
        requested,
        now,
      );

      return {
        allowed: Number(result[0]) === 1,
        remaining: Number(result[1]),
        limit: Number(result[2]),
        currentCount: Number(result[3]),
      };
    }

    throw error;
  }
}
