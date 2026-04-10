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
exports.handleGet = handleGet;
const server_1 = require("next/server");
const cookie_1 = require("./dist/cookie");
async function handleGet(req, res, redis) {
    let token = await (0, cookie_1.readAuthCookie)(req, { name: "accounts_token" });
    if (!token) {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return server_1.NextResponse.json({ success: false, error: "Missing authentication token" }, { status: 401 });
        }
        token = authHeader.replace("Bearer ", "").trim();
    }
    const redisRes = await redis(`jwtToken:auth:${token}`);
    if (!redisRes?.data?.secret) {
        return res.json({ success: false }, { status: 401 });
    }
    const jwt = await Promise.resolve().then(() => __importStar(require("jsonwebtoken")));
    jwt.verify(token, redisRes.data.secret);
    const headers = new Headers(req.headers);
    headers.set("x-jwt-secret", redisRes.data.secret);
    headers.set("Authorization", `Bearer ${token}`);
    return res.next({ request: { headers } });
}
