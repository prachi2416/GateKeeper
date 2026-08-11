import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

import redis from "./redisService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const luaPath = path.join(__dirname, "../lua/slidingWindowLog.lua");

const script = fs.readFileSync(luaPath, "utf8");

let scriptSha = null;

async function loadScript() {
  if (!scriptSha) {
    scriptSha = await redis.script("LOAD", script);
  }

  return scriptSha;
}

export async function slidingWindowLog({ key, window = 60, limit = 10 }) {
  const now = Date.now();
  const requestId = crypto.randomUUID();

  const sha = await loadScript();

  try {
    const result = await redis.evalsha(
      sha,
      1,
      key,
      window * 1000,
      limit,
      now,
      requestId,
    );

    return {
      allowed: Number(result[0]) === 1,
      remaining: Number(result[1]),
      limit: Number(result[2]),
    };
  } catch (error) {
    if (error.message.includes("NOSCRIPT")) {
      scriptSha = null;

      const newSha = await loadScript();

      const result = await redis.evalsha(
        newSha,
        1,
        key,
        window * 1000,
        limit,
        now,
        requestId,
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
