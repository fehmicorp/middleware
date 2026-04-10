"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = setAuthCookie;
exports.readAuthCookie = readAuthCookie;
async function setAuthCookie(res, token, cookieCfg) {
    if (!cookieCfg || !cookieCfg.name)
        return;
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(cookieCfg.name, token, {
        httpOnly: cookieCfg.httpOnly ?? true,
        secure: isProd ? (cookieCfg.secure ?? true) : true,
        sameSite: isProd ? cookieCfg.sameSite ?? "strict" : "none",
        path: cookieCfg.path ?? "/",
    });
}
async function readAuthCookie(req, cookieCfg) {
    if (!cookieCfg?.name)
        return null;
    const cookie = req.cookies.get(cookieCfg.name);
    return cookie?.value || null;
}
