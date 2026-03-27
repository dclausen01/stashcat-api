export interface LoginRequest {
    email: string;
    password: string;
    device_id: string;
    app_name: string;
    encrypted: string;
    callable: string;
    key_transfer_support: string;
}
export interface LoginResponse {
    client_key: string;
    userinfo: any;
}
export interface AuthState {
    clientKey?: string;
    deviceId: string;
    isAuthenticated: boolean;
}
export interface AuthConfig {
    email: string;
    password: string;
    appName?: string;
    /**
     * Security/encryption password for E2E decryption.
     * If provided, unlockE2E() is called automatically after login.
     * May be identical to the login password (Stashcat default).
     */
    securityPassword?: string;
    encrypted?: boolean;
    callable?: boolean;
    keyTransferSupport?: boolean;
}
//# sourceMappingURL=types.d.ts.map