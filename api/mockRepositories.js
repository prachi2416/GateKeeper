// In-memory mock repositories (resets on cold start - acceptable for demo)

export const notifications = new Map();
export const apiKeys = new Map();
export const benchmarks = new Map();
export const clients = new Map();

let notificationId = 1;
let apiKeyId = 1;
let benchmarkId = 1;

// Seed notifications
const seedNotifications = [
  {
    id: notificationId++,
    type: 'rate_limit',
    title: 'Rate limit exceeded',
    message: 'Client client-003 exceeded free tier limit on /api/v1/products',
    severity: 'warning',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: notificationId++,
    type: 'gateway',
    title: 'Gateway Instance 3 high CPU',
    message: 'CPU usage reached 85% on Gateway Instance 3 (EU-Central)',
    severity: 'warning',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: notificationId++,
    type: 'redis',
    title: 'Redis connection latency spike',
    message: 'Average Redis latency increased to 12ms (threshold: 10ms)',
    severity: 'info',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: notificationId++,
    type: 'tier',
    title: 'Client tier upgraded',
    message: 'client-002 upgraded from Free to Pro tier',
    severity: 'success',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: notificationId++,
    type: 'rate_limit',
    title: 'Burst capacity depleted',
    message: 'Enterprise client-001 burst capacity at 95% utilization',
    severity: 'info',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: notificationId++,
    type: 'gateway',
    title: 'Gateway Instance 2 recovered',
    message: 'Gateway Instance 2 (US-West) health status returned to healthy',
    severity: 'success',
    read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

seedNotifications.forEach((n) => notifications.set(n.id, n));

// Seed API keys
const seedApiKeys = [
  {
    id: apiKeyId++,
    name: 'Production API Key',
    key: 'gk_prod_' + Math.random().toString(36).substring(2, 18),
    key_hash: '****',
    usage_count: 124500,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: apiKeyId++,
    name: 'Staging API Key',
    key: 'gk_staging_' + Math.random().toString(36).substring(2, 18),
    key_hash: '****',
    usage_count: 34200,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: apiKeyId++,
    name: 'Development API Key',
    key: 'gk_dev_' + Math.random().toString(36).substring(2, 18),
    key_hash: '****',
    usage_count: 8900,
    status: 'revoked',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
];

seedApiKeys.forEach((k) => apiKeys.set(k.id, k));

// Seed benchmarks
const seedBenchmarks = [
  {
    id: benchmarkId++,
    algorithm: 'Token Bucket',
    throughput: 1250000,
    requests_per_sec: 1250000,
    p50: 2,
    p95: 5,
    p99: 12,
    memory_usage: 2.4,
    rejection_accuracy: 94.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: benchmarkId++,
    algorithm: 'Sliding Window Log',
    throughput: 680000,
    requests_per_sec: 680000,
    p50: 8,
    p95: 15,
    p99: 28,
    memory_usage: 48.2,
    rejection_accuracy: 99.8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: benchmarkId++,
    algorithm: 'Sliding Window Counter',
    throughput: 980000,
    requests_per_sec: 980000,
    p50: 4,
    p95: 9,
    p99: 18,
    memory_usage: 3.1,
    rejection_accuracy: 97.2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

seedBenchmarks.forEach((b) => benchmarks.set(b.id, b));

// Seed clients
const seedClients = [
  { client_id: 'client-001', tier: 'enterprise', request_limit: 10000, requests_used: 85432, status: 'active' },
  { client_id: 'client-002', tier: 'pro', request_limit: 1000, requests_used: 12450, status: 'active' },
  { client_id: 'client-003', tier: 'free', request_limit: 60, requests_used: 3421, status: 'active' },
  { client_id: 'client-004', tier: 'pro', request_limit: 1000, requests_used: 8765, status: 'active' },
  { client_id: 'client-005', tier: 'enterprise', request_limit: 10000, requests_used: 156789, status: 'active' },
];

seedClients.forEach((c) => clients.set(c.client_id, c));

export function getNextNotificationId() { return notificationId++; }
export function getNextApiKeyId() { return apiKeyId++; }
export function getNextBenchmarkId() { return benchmarkId++; }
