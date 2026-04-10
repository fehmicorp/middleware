import { NextResponse } from "next/server";
type NextLikeRequest = {
    method: string;
    headers: Headers;
    nextUrl: URL;
};
export declare class Proxy {
    static handle(req: NextLikeRequest, redisUrl: string): Promise<NextResponse<unknown>>;
}
export declare class CookieConfig {
    static setCookie(req: any, res: any, token: string, cookieCfg: any): Promise<void>;
}
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export interface DbConfig {
    id: string;
    baseUrl: string;
    timeoutMs?: number;
    headers?: Record<string, string>;
}
export interface RouteConfig {
    module?: string;
    route: string;
    methods?: HttpMethod[];
    dbConf?: string;
    target?: string;
}
export interface RequestContext {
    method: string;
    pathname: string;
    headers: Headers;
    query: URLSearchParams;
}
export type RouteResolver = (context: RequestContext) => Promise<RouteConfig | null> | RouteConfig | null;
export type DbConfigResolver = (dbConfId: string, context: RequestContext) => Promise<DbConfig | null> | DbConfig | null;
export interface UniversalMiddlewareOptions {
    routeResolver: RouteResolver;
    dbConfigResolver: DbConfigResolver;
    basePath?: string;
    debugHeader?: string;
}
export declare class UniversalNextMiddleware {
    private readonly options;
    private readonly basePath;
    private readonly debugHeader;
    constructor(options: UniversalMiddlewareOptions);
    handle(request: Request): Promise<Response>;
    private methodAllowed;
    private passThrough;
    private reject;
}
export declare function createUniversalNextMiddleware(options: UniversalMiddlewareOptions): {
    handle(request: Request): Promise<Response>;
};
export {};
