import { StashcatAPI } from '../api/request';
import { AuthState, AuthConfig } from './types';
export { AuthState, AuthConfig };
export declare class AuthManager {
    private api;
    private state;
    constructor(api: StashcatAPI, deviceId?: string);
    login(config: AuthConfig): Promise<AuthState>;
    /**
     * Restore a previously serialized session without a new login.
     * Useful for Nextcloud plugins that persist the client_key between requests.
     */
    restoreSession(clientKey: string): void;
    logout(): void;
    isAuthenticated(): boolean;
    getClientKey(): string | undefined;
    getDeviceId(): string;
    getState(): AuthState;
}
//# sourceMappingURL=login.d.ts.map