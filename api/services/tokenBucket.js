import { redisEval } from './redisService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const luaScript = fs.readFileSync(path.join(__dirname, '../lua/tokenBucket.lua'), 'utf8');

export async function tokenBucketCheck(clientId, capacity, refillRatePerSec, cost = 1) {
  const key = `ratelimit:tokenbucket:${clientId}`;
  const now = Date.now();
  const refillRatePerMs = refillRatePerSec / 1000;
  const ttl = Math.ceil(capacity / refillRatePerSec) * 1000 + 60000;

  const result = await redisEval(
    luaScript,
    1,
    key,
    capacity,
    refillRatePerMs,
    now,
    cost,
    ttl
  );

  if (result === null) {
    // Redis unavailable - allow request (fail open)
    return { allowed: true, remaining: capacity, retryAfter: 0 };
  }

  const allowed = result[0] === 1;
  const remaining = result[1];
  const retryAfter = allowed ? 0 : Math.ceil((cost - remaining) / refillRatePerSec);

  return { allowed, remaining, retryAfter };
}
