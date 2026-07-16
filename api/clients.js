import { clients } from './mockRepositories.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(clients.values());
      return res.status(200).json(all);
    }
    if (req.method === 'POST') {
      const { client_id, tier, request_limit, requests_used, status } = req.body;
      const c = {
        client_id,
        tier,
        request_limit,
        requests_used: requests_used || 0,
        status: status || 'active',
      };
      clients.set(client_id, c);
      return res.status(201).json(c);
    }
    if (req.method === 'PUT') {
      const { client_id, ...updates } = req.body;
      const c = clients.get(client_id);
      if (!c) return res.status(404).json({ error: 'Client not found' });
      Object.assign(c, updates);
      return res.status(200).json(c);
    }
    if (req.method === 'DELETE') {
      const { client_id } = req.body;
      clients.delete(client_id);
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
