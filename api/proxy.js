import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import { forwardRequest } from './services/proxyService.js';
import { clients } from './mockRepositories.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id, X-Algorithm');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const clientId = req.headers['x-client-id'] || 'anonymous';
    const algorithm = req.headers['x-algorithm'] || null;

    const client = clients.get(clientId);
    const tier = client?.tier || 'free';

    // Apply rate limiting
    const limitResult = await rateLimiterMiddleware(clientId, tier, algorithm);

    res.setHeader('X-RateLimit-Limit', limitResult.limit);
    res.setHeader('X-RateLimit-Remaining', limitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 60);

    if (!limitResult.allowed) {
      res.setHeader('Retry-After', limitResult.retryAfter);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        algorithm: limitResult.algorithm,
        retryAfter: limitResult.retryAfter,
      });
    }

    // Forward to upstream
    const upstream = await forwardRequest(
      req.method,
      req.url,
      req.headers,
      req.body
    );

    // Update client usage
    if (client) {
      client.requests_used = (client.requests_used || 0) + 1;
    }

    return res.status(upstream.status).json({
      ...upstream.body,
      rateLimit: {
        limit: limitResult.limit,
        remaining: limitResult.remaining,
        algorithm: limitResult.algorithm,
      },
    });
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
