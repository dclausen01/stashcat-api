"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
class AuthManager {
    constructor(api, deviceId) {
        this.api = api;
        this.state = {
            deviceId: deviceId || api.getDeviceId(),
            isAuthenticated: false,
        };
    }
    async login(config) {
        const loginRequest = {
            email: config.email,
            password: config.password,
            device_id: this.state.deviceId,
            app_name: config.appName || 'stashcat-api-client',
            encrypted: (config.encrypted ?? false).toString(),
            callable: (config.callable ?? false).toString(),
            key_transfer_support: (config.keyTransferSupport ?? false).toString(),
        };
        try {
            const response = await this.api.post('/auth/login', loginRequest);
            this.state.clientKey = response.client_key;
            this.state.isAuthenticated = true;
            // Set client key in API for subsequent requests
            this.api.setClientKey(response.client_key);
            return { ...this.state };
        }
        catch (error) {
            throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Restore a previously serialized session without a new login.
     * Useful for Nextcloud plugins that persist the client_key between requests.
     */
    restoreSession(clientKey) {
        this.state.clientKey = clientKey;
        this.state.isAuthenticated = true;
        this.api.setClientKey(clientKey);
    }
    logout() {
        this.state.clientKey = undefined;
        this.state.isAuthenticated = false;
    }
    isAuthenticated() {
        return this.state.isAuthenticated;
    }
    getClientKey() {
        return this.state.clientKey;
    }
    getDeviceId() {
        return this.state.deviceId;
    }
    getState() {
        return { ...this.state };
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=login.js.map