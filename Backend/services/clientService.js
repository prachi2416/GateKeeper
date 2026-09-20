import redis from "./redisService.js";

const CLIENT_PREFIX = "gatekeeper:client";
const API_KEY_INDEX = "gatekeeper:apikey";

function clientKey(id) {
  return `${CLIENT_PREFIX}:${id}`;
}

export async function getClientByApiKey(apiKey) {
  const clientId = await redis.get(`${API_KEY_INDEX}:${apiKey}`);

  if (!clientId) {
    return null;
  }

  const client = await redis.hgetall(clientKey(clientId));

  if (!client || !client.id) {
    return null;
  }

  return {
    ...client,
    limit: Number(client.limit),
    windowMs: Number(client.windowMs),
    refillRate: Number(client.refillRate),
  };
}
