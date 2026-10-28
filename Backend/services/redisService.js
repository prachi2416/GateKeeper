import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

export async function connectRedis() {
  try {
    await redis.connect();
    await redis.ping();
    console.log("Redis Connected");
  } catch (err) {
    console.error("Redis Connection Failed:", err.message);
    throw err;
  }
}

export default redis;
