const systemSettings = {
  id: 1,
  redis_host: 'redis-cluster.gatekeeper.internal',
  redis_port: 6379,
  algorithm_selection: 'token_bucket',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json(systemSettings);
    }
    if (req.method === 'PUT') {
      const updates = req.body;
      Object.assign(systemSettings, updates);
      return res.status(200).json(systemSettings);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
