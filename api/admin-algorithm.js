import { getDefaultAlgorithm, setDefaultAlgorithm, strategies } from './middleware/rateLimiter.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        algorithm: getDefaultAlgorithm(),
        available: Object.keys(strategies),
      });
    }

    if (req.method === 'POST') {
      const { algorithm } = req.body;
      if (!strategies[algorithm]) {
        return res.status(400).json({ error: 'Invalid algorithm' });
      }
      setDefaultAlgorithm(algorithm);
      return res.status(200).json({ algorithm, message: 'Algorithm updated' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
