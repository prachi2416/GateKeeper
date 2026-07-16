import { apiKeys, getNextApiKeyId } from './mockRepositories.js';

function generateKey() {
  return 'gk_' + Math.random().toString(36).substring(2, 10) + '_' + Math.random().toString(36).substring(2, 10);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const all = Array.from(apiKeys.values()).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.status(200).json(all);
    }

    if (req.method === 'POST') {
      const { name } = req.body;
      const key = generateKey();
      const k = {
        id: getNextApiKeyId(),
        name: name || 'New API Key',
        key,
        key_hash: key.substring(0, 8) + '****',
        usage_count: 0,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      apiKeys.set(k.id, k);
      return res.status(201).json(k);
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      const k = apiKeys.get(id);
      if (k) {
        k.status = status;
        return res.status(200).json(k);
      }
      return res.status(404).json({ error: 'Not found' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      apiKeys.delete(id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
