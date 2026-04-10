"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalNextMiddleware = exports.CookieConfig = exports.Proxy = void 0;
exports.createUniversalNextMiddleware = createUniversalNextMiddleware;
const server_1 = require("next/server");
const get_1 = require("./get");
const post_1 = require("./post");
const put_1 = require("./put");
const patch_1 = require("./patch");
const delete_1 = require("./delete");
const redis_1 = require("./dist/redis");
const ws_1 = require("./ws");
class Proxy {
    static async handle(req, redisUrl) {
        const redis = (0, redis_1.createRedisAccessor)(redisUrl);
        const method = req.method.toUpperCase();
        if (method === "POST") {
            return (0, post_1.handlePost)(req, server_1.NextResponse, redis);
        }
        if (method === "GET") {
            return (0, get_1.handleGet)(req, server_1.NextResponse, redis);
        }
        if (method === "PUT") {
            return (0, put_1.handlePut)(req, server_1.NextResponse, redis);
        }
        if (method === "PATCH") {
            return (0, patch_1.handlePatch)(req, server_1.NextResponse, redis);
        }
        if (method === "DELETE") {
            return (0, delete_1.handleDelete)(req, server_1.NextResponse, redis);
        }
        if (method === "WS") {
            return (0, ws_1.handleWS)(req, server_1.NextResponse, redis);
        }
        return server_1.NextResponse.next();
    }
}
exports.Proxy = Proxy;
class CookieConfig {
    static async setCookie(req, res, token, cookieCfg) {
        const fnKey = req.headers.get("x-fn-key") ? req.headers.get("x-fn-key") : null;
        const authKey = req.headers.get("x-auth-key") ? req.headers.get("x-auth-key") : null;
        const cookieName = fnKey ? `${authKey}:${fnKey}` : authKey ? `${authKey}` : null;
        const { setAuthCookie, readAuthCookie } = await Promise.resolve().then(() => __importStar(require("./dist/cookie")));
        const existingToken = await readAuthCookie(req, { name: cookieName });
        const cookieConfig = {
            ...cookieCfg.cookie,
            name: cookieName,
        };
        if (existingToken) {
            setAuthCookie(res, token, cookieConfig);
            return;
        }
        setAuthCookie(res, token, cookieConfig);
    }
}
exports.CookieConfig = CookieConfig;
class UniversalNextMiddleware {
    constructor(options) {
        this.options = options;
        this.basePath = (options.basePath ?? "/api").replace(/\/$/, "");
        this.debugHeader = options.debugHeader ?? "x-proxy-debug";
    }
    async handle(request) {
        const url = new URL(request.url);
        if (!url.pathname.startsWith(this.basePath)) {
            return this.passThrough("outside-base-path");
        }
        const context = {
            method: request.method,
            pathname: url.pathname,
            headers: request.headers,
            query: url.searchParams,
        };
        const route = await this.options.routeResolver(context);
        if (!route) {
            return this.reject(404, "ROUTE_NOT_FOUND", context.pathname);
        }
        if (!this.methodAllowed(route, context.method)) {
            return this.reject(405, "METHOD_NOT_ALLOWED", context.method);
        }
        if (!route.dbConf) {
            return this.reject(500, "DB_CONF_MISSING", context.pathname);
        }
        const dbConf = await this.options.dbConfigResolver(route.dbConf, context);
        if (!dbConf) {
            return this.reject(500, "DB_CONF_NOT_FOUND", route.dbConf);
        }
        const responseHeaders = new Headers();
        responseHeaders.set("x-proxy-target", route.target ?? `${dbConf.baseUrl}${route.route}`);
        responseHeaders.set("x-proxy-module", route.module ?? "default");
        responseHeaders.set("x-proxy-dbconf-id", dbConf.id);
        responseHeaders.set("x-proxy-timeout", String(dbConf.timeoutMs ?? 30000));
        if (dbConf.headers) {
            responseHeaders.set("x-proxy-dbconf-headers", JSON.stringify(dbConf.headers));
        }
        return new Response(null, {
            status: 204,
            headers: responseHeaders,
        });
    }
    methodAllowed(route, method) {
        if (!route.methods || route.methods.length === 0) {
            return true;
        }
        return route.methods.includes(method.toUpperCase());
    }
    passThrough(reason) {
        const headers = new Headers();
        headers.set(this.debugHeader, reason);
        return new Response(null, {
            status: 204,
            headers,
        });
    }
    reject(status, code, detail) {
        return new Response(JSON.stringify({
            ok: false,
            code,
            detail,
        }), {
            status,
            headers: {
                "content-type": "application/json",
            },
        });
    }
}
exports.UniversalNextMiddleware = UniversalNextMiddleware;
function createUniversalNextMiddleware(options) {
    const instance = new UniversalNextMiddleware(options);
    return {
        handle(request) {
            return instance.handle(request);
        },
    };
}
