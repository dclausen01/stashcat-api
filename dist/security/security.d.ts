import { StashcatAPI } from '../api/request';
import { MasterEncryptionKeyResponse, RsaPrivateKeyJwk, SigningKeyData, VerifiedKeysResponse } from '../encryption/types';
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
export declare class SecurityManager {
    private api;
    private rsaPrivateKey?;
    /** Cache: conversation/channel id → decrypted AES key Buffer */
    private aesKeyCache;
    constructor(api: StashcatAPI);
    /**
     * Retrieve the encrypted private key from the server.
     */
    getPrivateKey(): Promise<PrivateKeyResponse>;
    /**
     * Unlock E2E decryption by fetching and decrypting the RSA private key.
     * The private key is stored as a PKCS#8 PBES2 encrypted PEM, passphrase-protected
     * with the security password (which may equal the login password).
     *
     * Must be called before getConversationAesKey() or decryptMessage().
     */
    unlockPrivateKey(securityPassword: string): Promise<void>;
    /** Returns true if the RSA private key has been unlocked. */
    isUnlocked(): boolean;
    /**
     * RSA-OAEP decrypt a conversation/channel AES key.
     * @param encryptedKeyBase64 The base64-encoded RSA-encrypted AES key from conversation.key
     * @param cacheId Optional cache identifier (e.g. conversation/channel id)
     * @returns 32-byte AES key Buffer
     */
    decryptConversationKey(encryptedKeyBase64: string, cacheId?: string): Buffer;
    /** Clear the AES key cache (e.g. after logout) */
    clearKeyCache(): void;
    /**
     * Sign data with the unlocked RSA private key (RSA-SHA256, returns Buffer).
     * Used to sign key payloads for /security/set_missing_key.
     */
    signData(data: Buffer): Buffer;
    /**
     * Encrypt data with an RSA public key (OAEP+SHA256 padding).
     * Used to encrypt AES conversation keys for another user's public key.
     */
    static encryptWithPublicKey(publicKeyPem: string, data: Buffer): Buffer;
    /**
     * Set file access key (grants access to an encrypted file for a target user/channel)
     */
    setFileAccessKey(fileId: string, target: string, targetId: string, key: string, iv: string): Promise<void>;
    /**
     * Get the signing private key for device-to-device transfer.
     * Called BEFORE the user enters the 6-digit code.
     * The server returns an encrypted key structure waiting for the code.
     */
    getSigningKeyForTransfer(): Promise<SigningKeyData>;
    /**
     * Get master encryption key for key transfer verification.
     */
    getMasterEncryptionKey(): Promise<MasterEncryptionKeyResponse>;
    /**
     * Get verified key fingerprints.
     */
    getVerifiedKeys(): Promise<VerifiedKeysResponse>;
    /**
     * Decrypt the KEK (Key Encryption Key) using the 6-digit code.
     * The KEK is derived from the code using a KDF.
     * @param code The 6-digit code shown on the target device
     * @returns The decrypted KEK as Buffer
     */
    private deriveKEKFromCode;
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
    decryptSigningKeyWithCode(signingKeyData: SigningKeyData, code: string): Promise<RsaPrivateKeyJwk>;
    /**
     * Set the RSA private key directly from a JWK.
     * Used for session restoration or when receiving key via device transfer.
     * @param jwk The RSA private key in JWK format
     */
    setPrivateKeyFromJWK(jwk: RsaPrivateKeyJwk): void;
    /**
     * Export the current decrypted private key as JWK.
     * Useful for persisting the key in an encrypted session token.
     * @returns The private key as JWK, or undefined if not unlocked
     */
    exportPrivateKeyAsJWK(): RsaPrivateKeyJwk | undefined;
}
//# sourceMappingURL=security.d.ts.map