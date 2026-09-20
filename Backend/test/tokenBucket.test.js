import test from "node:test";
import assert from "node:assert/strict";

import { tokenBucket } from "../services/tokenBucket.js";
import redis from "../services/redisService.js";

test("Token Bucket allows requests within capacity", async () => {
  const key = `test:token-bucket:allowed:${Date.now()}`;

  const result = await tokenBucket({
    key,
    capacity: 3,
    refillRate: 1,
    requested: 1,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.limit, 3);
});

test("Token Bucket rejects requests when capacity is exhausted", async () => {
  const key = `test:token-bucket:rejected:${Date.now()}`;

  await tokenBucket({
    key,
    capacity: 2,
    refillRate: 0.0001,
    requested: 1,
  });

  await tokenBucket({
    key,
    capacity: 2,
    refillRate: 0.0001,
    requested: 1,
  });

  const result = await tokenBucket({
    key,
    capacity: 2,
    refillRate: 0.0001,
    requested: 1,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.remaining, 0);
  assert.equal(result.limit, 2);
});

test.after(async () => {
  await redis.quit();
});
