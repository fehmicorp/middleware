export declare function createRedisAccessor(redisUrl: string): (key: string) => Promise<{
    success: boolean;
    error: string;
    data?: undefined;
    detail?: undefined;
} | {
    success: boolean;
    data: any;
    error?: undefined;
    detail?: undefined;
} | {
    success: boolean;
    error: string;
    detail: any;
    data?: undefined;
}>;
