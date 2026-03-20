import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { APIResponse } from './response';

export interface StashcatConfig {
  baseUrl?: string;
  deviceId?: string;
  userAgent?: string;
}

export class StashcatAPI {
  private client: AxiosInstance;
  private config: StashcatConfig;
  private clientKey?: string;

  constructor(config: StashcatConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.stashcat.com/',
      deviceId: config.deviceId || this.generateDeviceId(),
      userAgent: config.userAgent || 'stashcat-api-client/1.0.0',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Accept': 'application/json',
        'User-Agent': this.config.userAgent,
      },
      timeout: 30000,
    });
  }

  private generateDeviceId(): string {
    return Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
  }

  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl!.endsWith('/') 
      ? this.config.baseUrl!.slice(0, -1) 
      : this.config.baseUrl!;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }

  async post<T>(path: string, data: any): Promise<T> {
    try {
      const response: AxiosResponse<APIResponse> = await this.client.post(
        this.buildUrl(path),
        data,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.status.value !== 'OK') {
        throw new Error(`API Error: ${response.data.status.short_message} - ${response.data.status.message}`);
      }

      return response.data.payload as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  getDeviceId(): string {
    return this.config.deviceId!;
  }

  setClientKey(clientKey: string): void {
    this.clientKey = clientKey;
  }

  getClientKey(): string | undefined {
    return this.clientKey;
  }

  /**
   * Download a file as raw binary Buffer.
   * The file ID is passed as a query parameter (?id=), auth goes in the POST body.
   */
  async downloadBinary(fileId: string): Promise<Buffer> {
    const params = new URLSearchParams({
      client_key: this.clientKey || '',
      device_id: this.config.deviceId || '',
    });
    try {
      const response = await this.client.post(
        this.buildUrl(`/file/download?id=${encodeURIComponent(fileId)}`),
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          responseType: 'arraybuffer',
        }
      );
      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Download failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Create authenticated request data by automatically adding client_key and device_id
   */
  createAuthenticatedRequestData(additionalData: any): any {
    const baseData = {
      client_key: this.clientKey,
      device_id: this.config.deviceId,
      ...additionalData,
    };

    // Remove undefined values
    Object.keys(baseData).forEach(key => {
      if (baseData[key] === undefined) {
        delete baseData[key];
      }
    });

    return baseData;
  }
}
