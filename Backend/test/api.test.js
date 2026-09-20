import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5000";

test("API rejects request without API key", async () => {
  const response = await fetch(`${BASE_URL}/api/test`);

  assert.equal(response.status, 401);
});

test("API rejects invalid API key", async () => {
  const response = await fetch(`${BASE_URL}/api/test`, {
    headers: {
      "X-API-Key": "invalid-key",
    },
  });

  assert.equal(response.status, 401);
});
