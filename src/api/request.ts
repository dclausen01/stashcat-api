import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
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
    return crypto.randomBytes(16).toString('hex');
  }

  private buildUrl(path: string): string {
    const baseUrl = this.config.baseUrl!.endsWith('/') 
      ? this.config.baseUrl!.slice(0, -1) 
      : this.config.baseUrl!;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${baseUrl}/${cleanPath}`;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    try {
      // Convert object to URLSearchParams for form-urlencoded
      let formData: string | URLSearchParams;
      if (typeof data === 'object' && data !== null) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
          if (Array.isArray(value)) {
            params.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
        formData = params;
      } else {
        formData = String(data);
      }

      const response: AxiosResponse<APIResponse> = await this.client.post(
        this.buildUrl(path),
        formData,
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

  getBaseUrl(): string {
    return this.config.baseUrl || 'https://api.stashcat.com/';
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
  createAuthenticatedRequestData(additionalData: object): Record<string, unknown> {
    const baseData: Record<string, unknown> = {
      client_key: this.clientKey,
      device_id: this.config.deviceId,
      ...(additionalData as Record<string, unknown>),
    };

    // Remove undefined values
    for (const key of Object.keys(baseData)) {
      if (baseData[key] === undefined) {
        delete baseData[key];
      }
    }

    return baseData;
  }
}
