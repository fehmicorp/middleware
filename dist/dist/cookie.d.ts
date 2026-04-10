export declare function setAuthCookie(res: any, token: string, cookieCfg: any): Promise<void>;
export declare function readAuthCookie(req: any, cookieCfg: any): Promise<string | null>;
