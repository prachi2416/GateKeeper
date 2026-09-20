import test from "node:test";
import assert from "node:assert/strict";

import { slidingWindowCounter } from "../services/slidingWindowCounter.js";
import redis from "../services/redisService.js";

test("Sliding Window Counter allows requests within limit", async () => {
  const key = `test:sliding-window-counter:allowed:${Date.now()}`;

  const result = await slidingWindowCounter({
    key,
    limit: 3,
    windowMs: 10000,
    requested: 1,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 2);
  assert.equal(result.limit, 3);
});

test("Sliding Window Counter rejects requests when limit is exhausted", async () => {
  const key = `test:sliding-window-counter:rejected:${Date.now()}`;

  await slidingWindowCounter({
    key,
    limit: 2,
    windowMs: 10000,
    requested: 1,
  });

  await slidingWindowCounter({
    key,
    limit: 2,
    windowMs: 10000,
    requested: 1,
  });

  const result = await slidingWindowCounter({
    key,
    limit: 2,
    windowMs: 10000,
    requested: 1,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
  assert.equal(result.limit, 2);
});

test.after(async () => {
  await redis.quit();
});
