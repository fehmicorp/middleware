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

// export function createRedisAccessor(redisUrl: string) {
//   return async (key: string) => {
//     try {
//       const client = await getRedisClient(redisUrl);
//       const raw = await client.get(key);

//       if (!raw) {
//         return { success: false, error: `No data for key '${key}'` };
//       }

//       return {
//         success: true,
//         data: JSON.parse(raw),
//       };
//     } catch (err: any) {
//       return {
//         success: false,
//         error: "Redis internal error",
//         detail: err.message,
//       };
//     }
//   };
// }

export function createRedisAccessor(redisUrl: string) {
  return async function redis(key: string) {

    console.log("Redis lookup:", key);

    const dummyRoutes: any = {
      "accounts": {
        success: true,
        data: {
          module: "accounts",
          route: "/auth/login",
          methods: ["POST"],
          security: {
            authRequired: false
          }
        }
      },

      "username:test:accounts": {
        success: true,
        data: {
          module: "accounts",
          route: "/users/test",
          methods: ["GET"]
        }
      },

      "jwtToken:auth:testtoken": {
        success: true,
        data: {
          secret: "test-secret"
        }
      }
    };

    return dummyRoutes[key] || { success: false };
  };
}