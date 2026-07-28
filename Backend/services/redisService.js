import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

export async function connectRedis() {
  try {
    await redis.connect();
    console.log("✅ Redis Connected");
  } catch (err) {
    console.error("❌ Redis Connection Failed");
    console.error(err.message);
  }
}

export default redis;
