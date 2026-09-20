<div align="center">

# GateKeeper

### A Redis-Backed API Gateway & Rate-Limiting Platform

*Built to understand how production API gateways actually enforce limits — not just to call a library.*

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Lua](https://img.shields.io/badge/Lua-Atomic%20Scripts-2C2D72?logo=lua&logoColor=white)](https://www.lua.org)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/tests-11%2F11%20passing-brightgreen)](#testing)

</div>
---

## Why this project exists

Most "rate limiter" side projects wrap a single npm package and call it done. GateKeeper goes the other direction: it implements **three distinct rate-limiting algorithms from first principles**, each backed by hand-written **atomic Lua scripts** running inside Redis — because the moment you do a "read, compute, write" rate-limit check as three separate JavaScript-side Redis calls, you've introduced a race condition that lets concurrent requests bypass the limit entirely.

That single design decision — pushing the read-compute-write cycle into Redis itself via Lua — is the difference between a rate limiter that *looks* correct in a demo and one that stays correct under concurrent production load. This README documents the reasoning behind that decision and the others that shaped the system.

## What it demonstrates

| Area | What's actually implemented |
|---|---|
| **Systems design** | Three rate-limiting algorithms (Token Bucket, Sliding Window Log, Sliding Window Counter) with different memory/precision trade-offs, chosen per-client at configuration time |
| **Concurrency correctness** | Every algorithm's state transition is a single atomic Lua script — no read-modify-write race conditions across concurrent requests |
| **Data modeling** | A Redis key schema designed for O(1) API-key → client lookups instead of scanning every client on every request |
| **API design** | Consistent REST semantics, correct status codes (401 vs 403 vs 429 vs 503), and standard rate-limit response headers (`X-RateLimit-*`, `Retry-After`) |
| **Failure handling** | If Redis is unreachable, the gateway **fails closed** with a 503 rather than silently letting every request through — a deliberate security trade-off, not an oversight |
| **Testing discipline** | Unit tests per algorithm plus end-to-end API integration tests, run through an automated regression runner (11/11 passing) |
| **Load awareness** | k6 burst and sustained-load scripts included to validate behavior under concurrent traffic, not just single-request correctness |
| **Full-stack delivery** | A companion React/TypeScript dashboard for managing clients, on top of a containerized backend |

---

## Table of Contents

- [Architecture](#architecture)
- [Request Lifecycle](#request-lifecycle)
- [Rate-Limiting Algorithms](#rate-limiting-algorithms)
- [Why Lua, Not JavaScript](#why-lua-not-javascript)
- [Redis Data Model](#redis-data-model)
- [API Reference](#api-reference)
- [HTTP Responses & Headers](#http-responses--headers)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Local Setup](#local-setup)
- [Testing](#testing)
- [Example Request Flow](#example-request-flow)
- [Security Considerations](#security-considerations)
- [Engineering Trade-offs](#engineering-trade-offs)
- [Future Improvements](#future-improvements)

---

## Architecture

GateKeeper is split into a stateless gateway layer and a Redis-backed state layer, fronted by a management dashboard.

```
┌─────────────────────┐
│  React + TypeScript │
│  Admin Dashboard     │
└──────────┬───────────┘
           │ HTTP
           ▼
┌──────────────────────┐
│  Express / Node.js   │
│  API Gateway         │
└──────────┬────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐  ┌──────────────────┐
│ Client  │  │ Rate Limiter      │
│ Service │  │ Middleware        │
└────┬────┘  └────────┬──────────┘
     │                │
     │                ▼
     │        ┌────────────────┐
     └───────►│ Redis + Lua     │
              │ (atomic state)  │
              └─────────────────┘
```

The gateway itself holds no rate-limit state — every decision is derived from Redis at request time, which means GateKeeper can be horizontally scaled behind a load balancer without any single instance becoming a source of truth.

## Request Lifecycle

```
1. Client sends request with X-API-Key header
2. GateKeeper resolves API key → client ID via Redis (O(1) lookup)
3. Client configuration (algorithm, limit, window) is loaded
4. The configured algorithm's Lua script evaluates the request atomically
5. GateKeeper forwards the request (200) or rejects it (401 / 403 / 429 / 503)
```

## Rate-Limiting Algorithms

Rather than picking one algorithm, GateKeeper implements three — because the "right" rate limiter depends entirely on the traffic pattern you're protecting against, and demonstrating that trade-off is the point.

### 1. Token Bucket
A bucket holds up to `capacity` tokens and refills at `refillRate` per unit time. Each request consumes one token.

```
capacity   = maximum burst size
refillRate = tokens added per unit time
request    = 1 token consumed
```

**Good for:** allowing short bursts while enforcing a long-run average rate.
`Backend/services/tokenBucket.js` · `Backend/lua/tokenBucket.lua`

### 2. Sliding Window Log
Every request timestamp is stored in a Redis sorted set. On each request, expired entries are trimmed, the remaining count is checked against the limit, and the new timestamp is recorded.

**Good for:** exact, strict enforcement with no boundary-burst edge cases.
**Trade-off:** memory grows with request volume within the window.
`Backend/services/slidingWindowLog.js` · `Backend/lua/slidingWindowLog.lua`

### 3. Sliding Window Counter
Keeps only two counters (current + previous window) and weights the previous window's contribution by how much it overlaps the current rolling interval.

**Good for:** near-exact rolling counts with **bounded, constant memory** per client — the production-realistic choice at scale.
`Backend/services/slidingWindowCounter.js` · `Backend/lua/slidingWindowCounter.lua`

### Algorithm Comparison

| Algorithm | State Stored | Burst Handling | Memory | Precision |
|---|---|---|---|---|
| **Token Bucket** | Token count + last-refill timestamp | Allows controlled bursts up to capacity | O(1) per client | Exact |
| **Sliding Window Log** | Individual request timestamps | No burst allowance beyond limit | O(n) per client | Exact |
| **Sliding Window Counter** | Two rolling counters | Smooths boundary bursts | O(1) per client | Approximate |

## Why Lua, Not JavaScript

This is the core engineering decision in the project, so it's worth stating explicitly.

A naive rate limiter does this in application code:
```
GET current_count       ← Redis round-trip #1
if count < limit: SET count + 1   ← Redis round-trip #2
```
Between those two round-trips, N concurrent requests can all read the same `current_count`, all see "under limit," and all get allowed — the classic **TOCTOU (time-of-check to time-of-use) race condition**. Under real concurrent load, this silently defeats the entire purpose of a rate limiter.

GateKeeper instead ships the read-check-write logic **into Redis as a single Lua script**, executed atomically by Redis's single-threaded command execution. There is no window in which two requests can interleave — correctness is guaranteed by Redis's execution model, not by application-level locking.

## Redis Data Model

**Client configuration**
```
gatekeeper:client:<clientId>  →  HASH { id, name, apiKey, algorithm, limit, windowMs, refillRate, status, createdAt }
```

**Client index**
```
gatekeeper:clients  →  SET of all client IDs
```

**API-key → client index** (avoids scanning every client on every request)
```
gatekeeper:apikey:<apiKey>  →  clientId

X-API-Key → gatekeeper:apikey:<key> → clientId → gatekeeper:client:<clientId>
```

**Rate-limit state** (namespaced per algorithm, per client — full isolation between clients)
```
gatekeeper:ratelimit:<algorithm>:<clientId>
```

## API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/clients` | Create a client |
| `GET` | `/api/clients` | List all clients |
| `GET` | `/api/clients/:id` | Get a single client |
| `PUT` | `/api/clients/:id` | Update client config (limit, status, etc.) |
| `DELETE` | `/api/clients/:id` | Delete a client and its API-key index |
| `GET` | `/api/test` | Protected route — requires `X-API-Key`, useful for verifying auth + rate limiting |

**Create Client**
```bash
POST /api/clients
Content-Type: application/json

{
  "name": "Example Client",
  "algorithm": "token-bucket",
  "limit": 10,
  "windowMs": 1000,
  "refillRate": 1
}
```

Supported `algorithm` values: `token-bucket` · `sliding-window-log` · `sliding-window-counter`
Supported `status` values: `active` · `disabled`

## HTTP Responses & Headers

| Status | Meaning | When |
|---|---|---|
| `200` | Allowed | Request within limit |
| `401` | Unauthorized | Missing or invalid `X-API-Key` |
| `403` | Forbidden | Client exists but is disabled |
| `429` | Too Many Requests | Rate limit exceeded |
| `503` | Service Unavailable | Redis unreachable — **fails closed**, never fails open |

**Successful response headers**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Algorithm: token-bucket
```

**429 response**
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "algorithm": "token-bucket",
  "limit": 10,
  "remaining": 0
}
```
also includes a `Retry-After` header.

## Project Structure

```
GateKeeper/
├── Backend/
│   ├── config/
│   ├── lua/                          # Atomic rate-limit logic
│   │   ├── tokenBucket.lua
│   │   ├── slidingWindowLog.lua
│   │   └── slidingWindowCounter.lua
│   ├── middleware/
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── admin.js
│   │   ├── clients.js
│   │   ├── debug.js
│   │   ├── health.js
│   │   ├── metrics.js
│   │   ├── notifications.js
│   │   └── proxy.js
│   ├── services/
│   │   ├── clientService.js
│   │   ├── proxyService.js
│   │   ├── redisService.js
│   │   ├── tokenBucket.js
│   │   ├── slidingWindowLog.js
│   │   └── slidingWindowCounter.js
│   ├── test/                         # Unit + integration tests
│   ├── loadtests/                    # k6 burst & sustained-load scripts
│   ├── run-tests.js
│   └── server.js
├── src/                               # React + TypeScript dashboard
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   ├── pages/
│   └── App.tsx
├── Dockerfile
├── docker-compose.yml
└── vite.config.ts
```

## Technology Stack

**Backend** — Node.js · Express · ioredis · Redis · Lua · Helmet · CORS · Compression · Morgan · dotenv
**Frontend** — React · TypeScript · Vite
**Testing** — Node.js built-in test runner · `assert/strict` · k6 (load testing)
**Infrastructure** — Docker · Redis 7

## Local Setup

**Prerequisites:** Node.js, Docker Desktop, Git

```bash
node --version
docker --version
```

**1. Start Redis**
```bash
docker run -d --name gatekeeper-redis -p 6379:6379 redis:7
# or, if it already exists:
docker start gatekeeper-redis

docker exec gatekeeper-redis redis-cli ping   # → PONG
```

**2. Start the backend**
```bash
cd Backend
npm install
node server.js
# → Redis Connected
# → Backend running on port 5000
```

**3. Start the frontend**
```bash
npm install
npm run dev
```

## Testing

Run from `GateKeeper/Backend`:
```bash
npm test
```

This executes the full suite via the Node.js built-in test runner:

```
Token Bucket              2/2
Sliding Window Log        2/2
Sliding Window Counter    2/2
API Integration           5/5
─────────────────────────────
Total                    11/11
```

The API integration suite specifically covers: valid API key · missing API key · invalid API key · 429 enforcement under limit exhaustion · disabled-client 403.

Load behavior under concurrency is separately exercised with `loadtests/k6_burst.js` and `loadtests/k6_sustained.js`, validating that the Lua-based atomicity holds under real concurrent traffic — not just sequential test-runner calls.

## Example Request Flow

```bash
# 1. Create a client with a tight limit for demonstration
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Example Client",
    "algorithm": "token-bucket",
    "limit": 3,
    "windowMs": 10000,
    "refillRate": 0.0001
  }'

# 2. Call the protected route with the returned API key
curl http://localhost:5000/api/test -H "X-API-Key: <API_KEY>"
```
```json
{ "success": true, "message": "Request allowed by GateKeeper", "timestamp": "..." }
```
After 3 requests within the window, subsequent calls return `429 Too Many Requests`.

## Security Considerations

- **API keys are credentials.** Never committed to Git, never placed in READMEs, never pasted into public issue trackers or screenshots. `.env` stays gitignored.
- **Fail closed, not open.** If Redis is unreachable, the rate limiter middleware returns `503` rather than silently allowing every request through — an explicit choice to prioritize protection over availability during infrastructure failure.
- **HTTP hardening** via Helmet, with CORS and compression configured at the gateway layer.
- **Redis isolation.** No public exposure without authentication/network controls; local development binds to the local Docker network only.

## Engineering Trade-offs

Documenting *why*, not just *what* — the part a README usually skips:

- **Why three algorithms instead of one?** Because "rate limiting" isn't one problem — strict enforcement (Sliding Window Log), burst tolerance (Token Bucket), and bounded-memory approximation (Sliding Window Counter) solve different problems, and picking the wrong one for a given traffic pattern is a real production mistake.
- **Why Lua scripts instead of Redis transactions (`MULTI`/`EXEC`)?** Transactions queue commands but can't branch on intermediate results computed mid-transaction. The rate-limit logic needs to read state, compute a decision, and conditionally write — that requires server-side scripting, not just command batching.
- **Why a direct API-key index instead of scanning clients?** At N clients, a scan-and-compare auth check is O(N) per request. The `gatekeeper:apikey:<key> → clientId` index makes authentication O(1) regardless of how many clients exist — the kind of decision that matters once you think past a demo with five test clients.
- **Why fail closed on Redis failure?** A rate limiter that fails open under infrastructure failure is a rate limiter that provides no protection exactly when a system is already under stress (which is often when Redis itself is struggling). Failing closed trades availability for correctness deliberately.

## Future Improvements

- More precise, algorithm-specific `Retry-After` calculation
- Expanded integration and load-test coverage
- Rate-limit analytics and historical usage metrics
- Distributed/multi-region deployment support
- Configurable Redis authentication (ACLs)
- OpenAPI/Swagger documentation
- Structured logging and observability (request tracing, metrics export)
- Additional gateway/proxy policies (IP allow/deny lists, quota tiers)
- Automated cleanup of stale development clients

---

<div align="center">

**GateKeeper** — a Redis-backed API gateway built to demonstrate concurrency-safe rate limiting, sound data modeling, and production-minded failure handling.

</div>