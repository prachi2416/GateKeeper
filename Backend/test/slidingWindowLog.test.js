import test from "node:test";
import assert from "node:assert/strict";
import redis from "../services/redisService.js";
import { slidingWindowLog } from "../services/slidingWindowLog.js";

test("Sliding Window Log allows requests within limit", async () => {
  const key = `test:sliding-log:allowed:${Date.now()}`;

  const result = await slidingWindowLog({
    key,
    limit: 3,
    windowMs: 10000,
    requested: 1,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 2);
  assert.equal(result.limit, 3);
});

test("Sliding Window Log rejects requests when limit is exhausted", async () => {
  const key = `test:sliding-log:rejected:${Date.now()}`;

  await slidingWindowLog({
    key,
    limit: 2,
    windowMs: 10000,
    requested: 1,
  });

  await slidingWindowLog({
    key,
    limit: 2,
    windowMs: 10000,
    requested: 1,
  });

  const result = await slidingWindowLog({
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