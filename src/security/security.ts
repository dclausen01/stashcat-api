import * as crypto from 'crypto';
import { StashcatAPI } from '../api/request';

/** Raw structure returned by /security/get_private_key */
export interface EncryptionKeyData {
  user_id: string;
  type: string;
  format: string;
  /** JSON-encoded string: { "private": "-----BEGIN ENCRYPTED PRIVATE KEY-----..." } */
  private_key: string;
  public_key?: string;
  public_key_signature?: string;
  time?: string;
  deleted?: string | null;
  version?: string;
}

export interface PrivateKeyResponse {
  keys: EncryptionKeyData;
}

export class SecurityManager {
  private rsaPrivateKey?: crypto.KeyObject;
  /** Cache: conversation/channel id → decrypted AES key Buffer */
  private aesKeyCache = new Map<string, Buffer>();

  constructor(private api: StashcatAPI) {}

  /**
   * Retrieve the encrypted private key from the server.
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
   * Unlock E2E decryption by fetching and decrypting the RSA private key.
   * The private key is stored as a PKCS#8 PBES2 encrypted PEM, passphrase-protected
   * with the security password (which may equal the login password).
   *
   * Must be called before getConversationAesKey() or decryptMessage().
   */
  async unlockPrivateKey(securityPassword: string): Promise<void> {
    const response = await this.getPrivateKey();
    const keyData = response.keys;
    // private_key is a JSON-encoded string: { "private": "-----BEGIN ENCRYPTED PRIVATE KEY-----..." }
    let parsed: { private?: string };
    try {
      parsed = JSON.parse(keyData.private_key) as { private?: string };
    } catch {
      throw new Error('Failed to parse private_key JSON from server response');
    }
    const encryptedPem = parsed.private;
    if (!encryptedPem) {
      throw new Error('private_key JSON does not contain "private" field');
    }
    try {
      this.rsaPrivateKey = crypto.createPrivateKey({
        key: encryptedPem,
        format: 'pem',
        passphrase: Buffer.from(securityPassword, 'utf8'),
      });
    } catch (error) {
      throw new Error(
        `Failed to decrypt RSA private key — check security password: ${error instanceof Error ? error.message : error}`
      );
    }
    this.aesKeyCache.clear();
  }

  /** Returns true if the RSA private key has been unlocked. */
  isUnlocked(): boolean {
    return !!this.rsaPrivateKey;
  }

  /**
   * RSA-OAEP decrypt a conversation/channel AES key.
   * @param encryptedKeyBase64 The base64-encoded RSA-encrypted AES key from conversation.key
   * @param cacheId Optional cache identifier (e.g. conversation/channel id)
   * @returns 32-byte AES key Buffer
   */
  decryptConversationKey(encryptedKeyBase64: string, cacheId?: string): Buffer {
    if (!this.rsaPrivateKey) {
      throw new Error('E2E not unlocked — call unlockE2E() first');
    }
    if (cacheId) {
      const cached = this.aesKeyCache.get(cacheId);
      if (cached) return cached;
    }
    const encryptedBuffer = Buffer.from(encryptedKeyBase64, 'base64');
    let aesKey: Buffer;
    try {
      aesKey = crypto.privateDecrypt(
        { key: this.rsaPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        encryptedBuffer
      );
    } catch (error) {
      throw new Error(
        `Failed to decrypt conversation AES key: ${error instanceof Error ? error.message : error}`
      );
    }
    if (cacheId) {
      this.aesKeyCache.set(cacheId, aesKey);
    }
    return aesKey;
  }

  /** Clear the AES key cache (e.g. after logout) */
  clearKeyCache(): void {
    this.aesKeyCache.clear();
    this.rsaPrivateKey = undefined;
  }

  /**
   * Sign data with the unlocked RSA private key (RSA-SHA256, returns Buffer).
   * Used to sign key payloads for /security/set_missing_key.
   */
  signData(data: Buffer): Buffer {
    if (!this.rsaPrivateKey) {
      throw new Error('E2E not unlocked — call unlockE2E() first');
    }
    return crypto.sign('sha256', data, this.rsaPrivateKey);
  }

  /**
   * Encrypt data with an RSA public key (OAEP+SHA256 padding).
   * Used to encrypt AES conversation keys for another user's public key.
   */
  static encryptWithPublicKey(publicKeyPem: string, data: Buffer): Buffer {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    return crypto.publicEncrypt(
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha1' },
      data
    );
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
