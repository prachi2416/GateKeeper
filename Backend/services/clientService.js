import redis from "./redisService.js";

const CLIENT_PREFIX = "gatekeeper:client";
const CLIENT_INDEX = "gatekeeper:clients";

function clientKey(id) {
  return `${CLIENT_PREFIX}:${id}`;
}

export async function getClientByApiKey(apiKey) {
  const ids = await redis.smembers(CLIENT_INDEX);

  if (!ids.length) {
    return null;
  }

  for (const id of ids) {
    const client = await redis.hgetall(clientKey(id));

    if (client && client.apiKey === apiKey) {
      return {
        ...client,
        limit: Number(client.limit),
        windowMs: Number(client.windowMs),
      };
    }
  }

  return null;
}
