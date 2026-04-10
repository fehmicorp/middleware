import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export declare function handlePost(req: NextRequest, res: typeof NextResponse, redis: (key: string) => Promise<any>): Promise<NextResponse<unknown>>;
