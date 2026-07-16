import { clients } from './mockRepositories.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { clientId } = req.query;

    if (req.method === 'GET') {
      const client = clients.get(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      return res.status(200).json({ client });
    }

    if (req.method === 'POST') {
      const { request_limit, tier } = req.body;
      const client = clients.get(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      if (request_limit !== undefined) client.request_limit = request_limit;
      if (tier !== undefined) client.tier = tier;
      return res.status(200).json({ client });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
