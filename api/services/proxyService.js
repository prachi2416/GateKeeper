export async function forwardRequest(method, url, headers, body) {
  // Mock upstream service - simulate forwarding
  const start = Date.now();

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, Math.random() * 50 + 10));

  const responseTime = Date.now() - start;

  return {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-upstream-time': `${responseTime}ms`,
    },
    body: {
      message: 'Request proxied successfully',
      upstream: 'mock-backend-service',
      timestamp: new Date().toISOString(),
      path: url,
      method,
      responseTime,
    },
  };
}
