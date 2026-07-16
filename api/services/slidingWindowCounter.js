import { redisEval } from './redisService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const luaScript = fs.readFileSync(path.join(__dirname, '../lua/slidingWindowCounter.lua'), 'utf8');

export async function slidingWindowCounterCheck(clientId, limit, windowMs) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const prevWindowStart = windowStart - windowMs;

  const currentKey = `ratelimit:swcounter:${clientId}:${windowStart}`;
  const prevKey = `ratelimit:swcounter:${clientId}:${prevWindowStart}`;
  const ttl = windowMs * 2 + 60000;

  const result = await redisEval(
    luaScript,
    2,
    currentKey,
    prevKey,
    now,
    windowMs,
    limit,
    ttl
  );

  if (result === null) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  const allowed = result[0] === 1;
  const remaining = result[1];
  const retryAfter = allowed ? 0 : Math.ceil(windowMs / 1000);

  return { allowed, remaining, retryAfter };
}
