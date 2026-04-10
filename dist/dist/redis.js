"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisAccessor = createRedisAccessor;
const redis_1 = require("redis");
const redisPool = new Map();
async function getRedisClient(redisUrl) {
    let client = redisPool.get(redisUrl);
    if (!client) {
        client = (0, redis_1.createClient)({ url: redisUrl });
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
function createRedisAccessor(redisUrl) {
    return async (key) => {
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
        }
        catch (err) {
            return {
                success: false,
                error: "Redis internal error",
                detail: err.message,
            };
        }
    };
}
