import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:5000";

const API_KEY = process.env.GATEKEEPER_TEST_API_KEY;

if (!API_KEY) {
  throw new Error("GATEKEEPER_TEST_API_KEY is not set");
}

async function createClient(name, limit = 3, refillRate = 0.0001) {
  const response = await fetch(`${BASE_URL}/api/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      algorithm: "token-bucket",
      limit,
      windowMs: 10000,
      refillRate,
    }),
  });

  assert.equal(response.status, 201);

const data = await response.json();

return data.client;
}

test("API allows a valid API key", async () => {
  const response = await fetch(`${BASE_URL}/api/test`, {
    headers: {
      "X-API-Key": API_KEY,
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-RateLimit-Limit"), "3");
  assert.ok(response.headers.get("X-RateLimit-Remaining") !== null);
  assert.equal(response.headers.get("X-RateLimit-Algorithm"), "token-bucket");
});

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

test("API returns 429 when rate limit is exceeded", async () => {
  const client = await createClient(`API 429 Test ${Date.now()}`, 2, 0.0001);

  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${BASE_URL}/api/test`, {
      headers: {
        "X-API-Key": client.apiKey,
      },
    });

    assert.equal(response.status, 200);
  }

  const response = await fetch(`${BASE_URL}/api/test`, {
    headers: {
      "X-API-Key": client.apiKey,
    },
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("X-RateLimit-Limit"), "2");
  assert.equal(response.headers.get("X-RateLimit-Remaining"), "0");
  assert.equal(response.headers.get("X-RateLimit-Algorithm"), "token-bucket");
  assert.equal(response.headers.get("Retry-After"), "1");
});

test("API returns 403 when client is disabled", async () => {
  const client = await createClient(`API 403 Test ${Date.now()}`, 3, 0.0001);

  const updateResponse = await fetch(`${BASE_URL}/api/clients/${client.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "disabled",
    }),
  });

  assert.equal(updateResponse.status, 200);

  const response = await fetch(`${BASE_URL}/api/test`, {
    headers: {
      "X-API-Key": client.apiKey,
    },
  });

  assert.equal(response.status, 403);
});
