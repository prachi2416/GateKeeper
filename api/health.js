import { getRedisClient } from './services/redisService.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let redisStatus = 'down';
  try {
    const client = getRedisClient();
    if (client) {
      await client.ping();
      redisStatus = 'up';
    }
  } catch {
    redisStatus = 'down';
  }

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      gateway: 'up',
      redis: redisStatus,
      database: 'up',
    },
  });
}
