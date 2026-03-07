import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readAuthCookie } from "./dist/cookie";

export async function handleGet(
  req: NextRequest,
  res: typeof NextResponse,
  redis: (key: string) => Promise<any>
) {
  let token = await readAuthCookie(req, { name: "accounts_token" });
  
  if (!token) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing authentication token" },
        { status: 401 }
      );
    }

    token = authHeader.replace("Bearer ", "").trim();
  }
  const redisRes = await redis(`jwtToken:auth:${token}`);
  if (!redisRes?.data?.secret) {
    return res.json({ success: false }, { status: 401 });
  }
  const jwt = await import("jsonwebtoken");
  jwt.verify(token, redisRes.data.secret);

  const headers = new Headers(req.headers);
  headers.set("x-jwt-secret", redisRes.data.secret);
  headers.set("Authorization", `Bearer ${token}`);

  return res.next({ request: { headers } });
}