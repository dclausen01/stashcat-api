import { StashcatAPI } from '../api/request';
import { LoginRequest, LoginResponse, AuthState, AuthConfig } from './types';

export { AuthState, AuthConfig };

export class AuthManager {
  private api: StashcatAPI;
  private state: AuthState;

  constructor(api: StashcatAPI, deviceId?: string) {
    this.api = api;
    this.state = {
      deviceId: deviceId || api.getDeviceId(),
      isAuthenticated: false,
    };
  }

  async login(config: AuthConfig): Promise<AuthState> {
    const loginRequest: LoginRequest = {
      email: config.email,
      password: config.password,
      device_id: this.state.deviceId,
      app_name: config.appName || 'stashcat-api-client',
      encrypted: (config.encrypted ?? false).toString(),
      callable: (config.callable ?? false).toString(),
      key_transfer_support: (config.keyTransferSupport ?? false).toString(),
    };

    try {
      const response: LoginResponse = await this.api.post('/auth/login', loginRequest);
      
      this.state.clientKey = response.client_key;
      this.state.isAuthenticated = true;
      
      // Set client key in API for subsequent requests
      this.api.setClientKey(response.client_key);
      
      return { ...this.state };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore a previously serialized session without a new login.
   * Useful for Nextcloud plugins that persist the client_key between requests.
   */
  restoreSession(clientKey: string): void {
    this.state.clientKey = clientKey;
    this.state.isAuthenticated = true;
    this.api.setClientKey(clientKey);
  }

  logout(): void {
    this.state.clientKey = undefined;
    this.state.isAuthenticated = false;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getClientKey(): string | undefined {
    return this.state.clientKey;
  }

  getDeviceId(): string {
    return this.state.deviceId;
  }

  getState(): AuthState {
    return { ...this.state };
  }
}
