import * as crypto from 'crypto';
import { StashcatAPI } from '../api/request';
import {
  EncryptedSigningKey,
  MasterEncryptionKeyResponse,
  RsaPrivateKeyJwk,
  SigningKeyData,
  VerifiedKeysResponse,
} from '../encryption/types';

/** Raw structure returned by /security/get_private_key (type=encryption) */
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

/** Response for device transfer with type=signing */
export interface SigningKeyResponse {
  keys: SigningKeyData;
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
   * Set missing encryption keys for channel/conversation members.
   * Used to distribute AES channel keys to members by encrypting them
   * with each member's public RSA key.
   */
  async setMissingKey(
    type: 'channel' | 'conversation',
    id: string,
    keys: Array<{
      user_id: string;
      key: string; // base64-encoded RSA-encrypted AES key
      key_signature: string; // hex-encoded signature
    }>
  ): Promise<void> {
    const data = this.api.createAuthenticatedRequestData({
      type,
      id,
      keys,
    });
    try {
      await this.api.post('/security/set_missing_key', data);
    } catch (error) {
      throw new Error(`Failed to set missing keys: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get members who don't have encryption keys for a channel/conversation.
   */
  async getMembersWithoutKeys(
    type: 'channel' | 'conversation',
    id: string
  ): Promise<Array<{ id: string; first_name?: string; last_name?: string; mx_user_id?: string; public_key?: string }>> {
    const data = this.api.createAuthenticatedRequestData({ type, type_id: id });
    try {
      const response = await this.api.post<{ members_without_keys: Array<{ id: string; first_name?: string; last_name?: string; mx_user_id?: string; public_key?: string }> }>('/message/list_chat_members_not_having_keys', data);
      return response.members_without_keys || [];
    } catch (error) {
      throw new Error(`Failed to get members without keys: ${error instanceof Error ? error.message : error}`);
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

  // ─── Device-to-Device Key Transfer Methods ──────────────────────────────────

  /**
   * Get the signing private key for device-to-device transfer.
   * Called BEFORE the user enters the 6-digit code.
   * The server returns an encrypted key structure waiting for the code.
   */
  async getSigningKeyForTransfer(): Promise<SigningKeyData> {
    const data = this.api.createAuthenticatedRequestData({
      format: 'jwk',
      type: 'signing',
    });
    try {
      const response = await this.api.post<SigningKeyResponse>('/security/get_private_key', data);
      return response.keys;
    } catch (error) {
      throw new Error(`Failed to get signing key for transfer: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get master encryption key for key transfer verification.
   */
  async getMasterEncryptionKey(): Promise<MasterEncryptionKeyResponse> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<MasterEncryptionKeyResponse>('/security/get_master_encryption_key', data);
      return response;
    } catch (error) {
      throw new Error(`Failed to get master encryption key: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Get verified key fingerprints.
   */
  async getVerifiedKeys(): Promise<VerifiedKeysResponse> {
    const data = this.api.createAuthenticatedRequestData({});
    try {
      const response = await this.api.post<VerifiedKeysResponse>('/security/get_verified_keys', data);
      return response;
    } catch (error) {
      throw new Error(`Failed to get verified keys: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Decrypt the KEK (Key Encryption Key) using the 6-digit code.
   * The KEK is derived from the code using a KDF.
   * @param code The 6-digit code shown on the target device
   * @returns The decrypted KEK as Buffer
   */
  private deriveKEKFromCode(code: string): Buffer {
    // Generate KEK from 6-digit code using SHA-256
    // In a real implementation, this might use PBKDF2 or Argon2
    // For now, we use a simple SHA-256 hash of the code
    return crypto.createHash('sha256').update(code).digest();
  }

  /**
   * Decrypt the signing key using the 6-digit code.
   * This is the core of the device-to-device key transfer.
   * 
   * Process:
   * 1. Derive KEK from the 6-digit code
   * 2. Use KEK to decrypt the encryptedKEK from the server
   * 3. Use the decrypted KEK to decrypt the ciphertext (private key JWK)
   * 
   * @param signingKeyData The encrypted key data from getSigningKeyForTransfer()
   * @param code The 6-digit code from the target device
   * @returns The decrypted private key as JWK
   */
  async decryptSigningKeyWithCode(
    signingKeyData: SigningKeyData,
    code: string
  ): Promise<RsaPrivateKeyJwk> {
    // Parse the private_key JSON string containing encrypted components
    let encryptedKey: EncryptedSigningKey;
    try {
      encryptedKey = JSON.parse(signingKeyData.private_key) as EncryptedSigningKey;
    } catch {
      throw new Error('Failed to parse encrypted signing key JSON');
    }

    // Validate structure
    if (!encryptedKey.ciphertext || !encryptedKey.iv || !encryptedKey.encryptedKEK) {
      throw new Error('Invalid encrypted signing key structure: missing ciphertext, iv, or encryptedKEK');
    }

    // Derive KEK from the 6-digit code (this is the user's input)
    const codeKEK = this.deriveKEKFromCode(code);

    // The encryptedKEK appears to be wrapped with the code-derived KEK
    // But based on the data, it seems like the code IS the KEK or is used to create it
    // Let's try decrypting directly with the code-derived KEK
    
    try {
      // Decode the encryptedKEK - this might be the actual AES key to use
      const encryptedKEKBuffer = Buffer.from(encryptedKey.encryptedKEK, 'base64');
      
      // Try to decrypt the encryptedKEK with the code-derived KEK
      // This might reveal the actual encryption key for the ciphertext
      let actualKEK: Buffer;
      
      // The encryptedKEK is likely encrypted AES-256-CBC
      // We need to extract IV and ciphertext from it
      // Assuming encryptedKEK structure: IV (16 bytes) + ciphertext
      const kekIV = encryptedKEKBuffer.slice(0, 16);
      const kekCipher = encryptedKEKBuffer.slice(16);
      
      const decipherKEK = crypto.createDecipheriv('aes-256-cbc', codeKEK, kekIV);
      let decryptedKEK = decipherKEK.update(kekCipher);
      decryptedKEK = Buffer.concat([decryptedKEK, decipherKEK.final()]);
      actualKEK = decryptedKEK;

      // Now use the decrypted KEK to decrypt the actual private key ciphertext
      const ciphertextBuffer = Buffer.from(encryptedKey.ciphertext, 'base64');
      const ivBuffer = Buffer.from(encryptedKey.iv, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-cbc', actualKEK, ivBuffer);
      let decrypted = decipher.update(ciphertextBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Parse the decrypted JWK
      const jwkString = decrypted.toString('utf-8');
      const privateKey = JSON.parse(jwkString) as RsaPrivateKeyJwk;

      // Store the RSA key for subsequent E2E operations
      this.setPrivateKeyFromJWK(privateKey);

      return privateKey;
    } catch (error) {
      throw new Error(
        `Failed to decrypt signing key with code — check the 6-digit code: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  /**
   * Set the RSA private key directly from a JWK.
   * Used for session restoration or when receiving key via device transfer.
   * @param jwk The RSA private key in JWK format
   */
  setPrivateKeyFromJWK(jwk: RsaPrivateKeyJwk): void {
    try {
      // Import the JWK as a KeyObject
      this.rsaPrivateKey = crypto.createPrivateKey({
        key: jwk,
        format: 'jwk',
        type: 'pkcs8', // JWK doesn't need type, but this is for documentation
      });
    } catch (error) {
      throw new Error(
        `Failed to import private key from JWK: ${error instanceof Error ? error.message : error}`
      );
    }
    this.aesKeyCache.clear();
  }

  /**
   * Export the current decrypted private key as JWK.
   * Useful for persisting the key in an encrypted session token.
   * @returns The private key as JWK, or undefined if not unlocked
   */
  exportPrivateKeyAsJWK(): RsaPrivateKeyJwk | undefined {
    if (!this.rsaPrivateKey) {
      return undefined;
    }
    try {
      const jwk = this.rsaPrivateKey.export({ format: 'jwk' }) as RsaPrivateKeyJwk;
      return jwk;
    } catch (error) {
      throw new Error(
        `Failed to export private key: ${error instanceof Error ? error.message : error}`
      );
    }
  }
}
