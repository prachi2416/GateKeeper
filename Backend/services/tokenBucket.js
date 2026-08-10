import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import redis from "./redisService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const luaPath = path.join(__dirname, "../lua/tokenBucket.lua");
const tokenBucketScript = fs.readFileSync(luaPath, "utf8");

let scriptSha = null;

async function loadScript() {
  if (!scriptSha) {
    scriptSha = await redis.script("LOAD", tokenBucketScript);
  }

  return scriptSha;
}

export async function tokenBucket({
  key,
  capacity = 10,
  refillRate = 1,
  requested = 1,
}) {
  const now = Date.now() / 1000;

  const sha = await loadScript();

  try {
    const result = await redis.evalsha(
      sha,
      1,
      key,
      capacity,
      refillRate,
      requested,
      now,
    );

    return {
      allowed: Number(result[0]) === 1,
      remaining: Number(result[1]),
      limit: Number(result[2]),
    };
  } catch (error) {
    // If Redis lost the cached script, reload it once.
    if (error.message.includes("NOSCRIPT")) {
      scriptSha = null;

      const newSha = await loadScript();

      const result = await redis.evalsha(
        newSha,
        1,
        key,
        capacity,
        refillRate,
        requested,
        now,
      );

      return {
        allowed: Number(result[0]) === 1,
        remaining: Number(result[1]),
        limit: Number(result[2]),
      };
    }

    throw error;
  }
}
