import Redis from 'ioredis';

let redis = null;

function getRedis() {
  if (redis) return redis;

  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);

  try {
    redis = new Redis({
      host,
      port,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('[redis] connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[redis] connected to', host, port);
    });
  } catch (err) {
    console.error('[redis] failed to create client:', err.message);
  }

  return redis;
}

export async function redisEval(shaOrScript, keysCount, ...args) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.eval(shaOrScript, keysCount, ...args);
  } catch (err) {
    console.error('[redis] EVAL error:', err.message);
    return null;
  }
}

export async function redisGet(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (err) {
    return null;
  }
}

export async function redisSet(key, value, ttlMs) {
  const client = getRedis();
  if (!client) return null;
  try {
    if (ttlMs) {
      return await client.set(key, value, 'PX', ttlMs);
    }
    return await client.set(key, value);
  } catch (err) {
    return null;
  }
}

export async function redisDel(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.del(key);
  } catch (err) {
    return null;
  }
}

export async function redisIncr(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.incr(key);
  } catch (err) {
    return null;
  }
}

export async function redisZadd(key, score, member) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.zadd(key, score, member);
  } catch (err) {
    return null;
  }
}

export async function redisZremrangebyscore(key, min, max) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.zremrangebyscore(key, min, max);
  } catch (err) {
    return null;
  }
}

export async function redisZcard(key) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.zcard(key);
  } catch (err) {
    return null;
  }
}

export async function redisInfo(section) {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.info(section);
  } catch (err) {
    return null;
  }
}

export function getRedisClient() {
  return getRedis();
}

export default getRedis;
