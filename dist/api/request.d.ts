export interface StashcatConfig {
    baseUrl?: string;
    deviceId?: string;
    userAgent?: string;
}
export declare class StashcatAPI {
    private client;
    private config;
    private clientKey?;
    constructor(config?: StashcatConfig);
    private generateDeviceId;
    private buildUrl;
    post<T>(path: string, data: unknown): Promise<T>;
    getDeviceId(): string;
    setClientKey(clientKey: string): void;
    getClientKey(): string | undefined;
    getBaseUrl(): string;
    /**
     * Download a file as raw binary Buffer.
     * The file ID is passed as a query parameter (?id=), auth goes in the POST body.
     */
    downloadBinary(fileId: string): Promise<Buffer>;
    /**
     * Create authenticated request data by automatically adding client_key and device_id
     */
    createAuthenticatedRequestData(additionalData: object): Record<string, unknown>;
}
//# sourceMappingURL=request.d.ts.map