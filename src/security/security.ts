import { StashcatAPI } from '../api/request';

export interface PrivateKeyResponse {
  private_key: string;
  iv?: string;
}

export class SecurityManager {
  constructor(private api: StashcatAPI) {}

  /**
   * Retrieve the encrypted private key for the current session.
   * The private key is needed for decrypting E2E-encrypted messages.
   */
  async getPrivateKey(): Promise<PrivateKeyResponse> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<PrivateKeyResponse>('/security/get_private_key', data);
      return response;
    } catch (error) {
      throw new Error(`Failed to get private key: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Set file access key (grants access to an encrypted file for a target user/channel)
   */
  async setFileAccessKey(
    fileId: string,
    target: string,
    targetId: string,
    key: string,
    iv: string
  ): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      file_id: fileId,
      target,
      target_id: targetId,
      key,
      iv,
    });
    try {
      await this.api.post('/security/set_file_access_key', data);
    } catch (error) {
      throw new Error(`Failed to set file access key: ${error instanceof Error ? error.message : error}`);
    }
  }
}
