import { createClient, RedisClientType } from "redis";

const redisPool = new Map<string, RedisClientType>();

async function getRedisClient(redisUrl: string): Promise<RedisClientType> {
  let client = redisPool.get(redisUrl);

  if (!client) {
    client = createClient({ url: redisUrl });

    client.on("error", (err) => {
      console.error("[fc-proxy] Redis error:", err);
    });

    await client.connect();
    redisPool.set(redisUrl, client);
  }

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export function createRedisAccessor(redisUrl: string) {
  return async (key: string) => {
    try {
      const client = await getRedisClient(redisUrl);
      const raw = await client.get(key);

      if (!raw) {
        return { success: false, error: `No data for key '${key}'` };
      }

      return {
        success: true,
        data: JSON.parse(raw),
      };
    } catch (err: any) {
      return {
        success: false,
        error: "Redis internal error",
        detail: err.message,
      };
    }
  };
}