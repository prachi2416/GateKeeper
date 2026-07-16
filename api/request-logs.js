const requestLogs = [];
let logId = 1;

function seedLogs() {
  if (requestLogs.length > 0) return;
  const seed = [
    { client_id: 'client-001', endpoint: '/api/v1/users', status: 'allowed', algorithm: 'token_bucket', response_time: 24 },
    { client_id: 'client-002', endpoint: '/api/v1/orders', status: 'allowed', algorithm: 'token_bucket', response_time: 18 },
    { client_id: 'client-003', endpoint: '/api/v1/products', status: 'blocked', algorithm: 'sliding_window_counter', response_time: 0 },
    { client_id: 'client-001', endpoint: '/api/v1/analytics', status: 'allowed', algorithm: 'token_bucket', response_time: 45 },
    { client_id: 'client-004', endpoint: '/api/v1/users', status: 'allowed', algorithm: 'sliding_window_log', response_time: 22 },
    { client_id: 'client-005', endpoint: '/api/v1/orders', status: 'allowed', algorithm: 'token_bucket', response_time: 31 },
    { client_id: 'client-002', endpoint: '/api/v1/products', status: 'allowed', algorithm: 'token_bucket', response_time: 15 },
    { client_id: 'client-006', endpoint: '/api/v1/users', status: 'blocked', algorithm: 'token_bucket', response_time: 0 },
    { client_id: 'client-007', endpoint: '/api/v1/orders', status: 'allowed', algorithm: 'sliding_window_counter', response_time: 28 },
    { client_id: 'client-008', endpoint: '/api/v1/analytics', status: 'allowed', algorithm: 'token_bucket', response_time: 52 },
  ];
  seed.forEach((l) => {
    requestLogs.unshift({ id: logId++, timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(), ...l });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  seedLogs();

  try {
    if (req.method === 'GET') {
      const limit = Number(req.query.limit || 50);
      return res.status(200).json(requestLogs.slice(0, limit));
    }
    if (req.method === 'POST') {
      const { client_id, endpoint, status, algorithm, response_time } = req.body;
      const log = {
        id: logId++,
        timestamp: new Date().toISOString(),
        client_id,
        endpoint,
        status,
        algorithm,
        response_time,
      };
      requestLogs.unshift(log);
      return res.status(201).json(log);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
