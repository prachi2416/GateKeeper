const gatewayInstances = new Map([
  ['gw-1', { id: 1, name: 'Gateway Instance 1', region: 'US-East', status: 'active', cpu_usage: 34, memory_usage: 62, requests_handled: 1245000, health_status: 'healthy' }],
  ['gw-2', { id: 2, name: 'Gateway Instance 2', region: 'US-West', status: 'active', cpu_usage: 28, memory_usage: 55, requests_handled: 987000, health_status: 'healthy' }],
  ['gw-3', { id: 3, name: 'Gateway Instance 3', region: 'EU-Central', status: 'active', cpu_usage: 41, memory_usage: 71, requests_handled: 856000, health_status: 'warning' }],
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(gatewayInstances.values());
      return res.status(200).json(all);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const key = `gw-${id}`;
      const inst = gatewayInstances.get(key);
      if (inst) {
        Object.assign(inst, updates);
        return res.status(200).json(inst);
      }
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
