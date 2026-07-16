const rateLimits = new Map([
  ['free', { id: 1, tier: 'free', requests_per_minute: 60, burst_capacity: 10, refill_rate: 1 }],
  ['pro', { id: 2, tier: 'pro', requests_per_minute: 1000, burst_capacity: 100, refill_rate: 16 }],
  ['enterprise', { id: 3, tier: 'enterprise', requests_per_minute: 10000, burst_capacity: 500, refill_rate: 166 }],
]);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(rateLimits.values());
      return res.status(200).json(all);
    }
    if (req.method === 'PUT') {
      const { tier, ...updates } = req.body;
      const rl = rateLimits.get(tier);
      if (rl) {
        Object.assign(rl, updates);
        return res.status(200).json(rl);
      }
      return res.status(404).json({ error: 'Tier not found' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
