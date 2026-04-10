import { NextResponse } from "next/server";
import { handleGet } from "./get";
import { handlePost } from "./post";
import { handlePut } from "./put";
import { handlePatch } from "./patch";
import { handleDelete } from "./delete";
import { createRedisAccessor } from "./dist/redis";
import { handleWS } from "./ws";

type NextLikeRequest = {
  method: string;
  headers: Headers;
  nextUrl: URL;
};

export class Proxy {
  static async handle(req: NextLikeRequest, redisUrl: string) {
    const redis = createRedisAccessor(redisUrl);
    const method = req.method.toUpperCase();

    if (method === "POST") {
      return handlePost(req as any, NextResponse, redis);
    }

    if (method === "GET") {
      return handleGet(req as any, NextResponse, redis);
    }

    if (method === "PUT") {
      return handlePut(req as any, NextResponse, redis);
    }

    if (method === "PATCH") {
      return handlePatch(req as any, NextResponse, redis);
    }

    if (method === "DELETE") {
      return handleDelete(req as any, NextResponse, redis);
    }

    if (method === "WS") {
      return handleWS(req as any, NextResponse, redis);
    }

    return NextResponse.next();
  }
}

export class CookieConfig {
  static async setCookie(req: any, res: any, token: string, cookieCfg: any) {
    const fnKey = req.headers.get("x-fn-key") ? req.headers.get("x-fn-key") : null;
    const authKey = req.headers.get("x-auth-key") ? req.headers.get("x-auth-key") : null;
    const cookieName = fnKey ? `${authKey}:${fnKey}` : authKey ? `${authKey}` : null;
    const { setAuthCookie, readAuthCookie } = await import("./dist/cookie");
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

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

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

export type RouteResolver = (
  context: RequestContext,
) => Promise<RouteConfig | null> | RouteConfig | null;

export type DbConfigResolver = (
  dbConfId: string,
  context: RequestContext,
) => Promise<DbConfig | null> | DbConfig | null;

export interface UniversalMiddlewareOptions {
  routeResolver: RouteResolver;
  dbConfigResolver: DbConfigResolver;
  basePath?: string;
  debugHeader?: string;
}

export class UniversalNextMiddleware {
  private readonly basePath: string;
  private readonly debugHeader: string;

  constructor(private readonly options: UniversalMiddlewareOptions) {
    this.basePath = (options.basePath ?? "/api").replace(/\/$/, "");
    this.debugHeader = options.debugHeader ?? "x-proxy-debug";
  }

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith(this.basePath)) {
      return this.passThrough("outside-base-path");
    }

    const context: RequestContext = {
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
    responseHeaders.set("x-proxy-timeout", String(dbConf.timeoutMs ?? 30_000));

    if (dbConf.headers) {
      responseHeaders.set("x-proxy-dbconf-headers", JSON.stringify(dbConf.headers));
    }

    return new Response(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  private methodAllowed(route: RouteConfig, method: string): boolean {
    if (!route.methods || route.methods.length === 0) {
      return true;
    }

    return route.methods.includes(method.toUpperCase() as HttpMethod);
  }

  private passThrough(reason: string): Response {
    const headers = new Headers();
    headers.set(this.debugHeader, reason);

    return new Response(null, {
      status: 204,
      headers,
    });
  }

  private reject(status: number, code: string, detail: string): Response {
    return new Response(
      JSON.stringify({
        ok: false,
        code,
        detail,
      }),
      {
        status,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
}

export function createUniversalNextMiddleware(options: UniversalMiddlewareOptions) {
  const instance = new UniversalNextMiddleware(options);

  return {
    handle(request: Request) {
      return instance.handle(request);
    },
  };
}
