"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePut = handlePut;
async function handlePut(req, res, redis) {
    const xKey = req.headers.get("x-key");
    if (!xKey) {
        return res.json({ success: false, error: "Missing x-key" }, { status: 400 });
    }
    const params = Array.from(req.nextUrl.searchParams.entries());
    let selectedParam = null;
    const fnKey = req.nextUrl.searchParams.get("fnKey");
    for (const [k, v] of params) {
        if (k === "fnKey")
            continue;
        if (k === "refresh")
            continue;
        selectedParam = { key: k, value: v };
        break;
    }
    const redisKey = selectedParam && fnKey
        ? `${selectedParam.key}:${selectedParam.value}:${xKey}:${fnKey}`
        : selectedParam
            ? `${selectedParam.key}:${selectedParam.value}:${xKey}`
            : fnKey
                ? `${xKey}:${fnKey}:`
                : `${xKey}`;
    const redisRes = await redis(redisKey);
    if (!redisRes.success) {
        return res.json({ success: false, error: "Missing redis mapped data" }, { status: 401 });
    }
    const headers = new Headers(req.headers);
    headers.delete("x-key");
    headers.set("x-auth-key", xKey);
    if (fnKey) {
        headers.set("x-fn-key", fnKey);
    }
    headers.set("x-auth-data", JSON.stringify(redisRes.data));
    if (selectedParam) {
        headers.set(`x-${selectedParam.key}-key`, selectedParam.value);
    }
    return res.next({ request: { headers } });
}
