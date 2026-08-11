import redis from "./redisService.js";

const CLIENT_PREFIX = "gatekeeper:client";
const CLIENT_INDEX = "gatekeeper:clients";

function clientKey(id) {
  return `${CLIENT_PREFIX}:${id}`;
}

export async function getClientById(id) {
  if (!id) return null;

  const client = await redis.hgetall(clientKey(id));

  if (!client || !client.id) {
    return null;
  }

  return {
    ...client,
    limit: Number(client.limit),
    windowMs: Number(client.windowMs),
  };
}

export async function getClientByApiKey(apiKey) {
  if (!apiKey) return null;

  const ids = await redis.smembers(CLIENT_INDEX);

  if (!ids.length) {
    return null;
  }

  const pipeline = redis.pipeline();

  ids.forEach((id) => {
    pipeline.hget(clientKey(id), "apiKey");
  });

  const results = await pipeline.exec();

  for (let i = 0; i < results.length; i++) {
    const [error, storedApiKey] = results[i];

    if (!error && storedApiKey === apiKey) {
      return getClientById(ids[i]);
    }
  }

  return null;
}
