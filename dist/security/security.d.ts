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
     * Set file access key (grants access to an encrypted file for a target user/channel)
     */
    setFileAccessKey(fileId: string, target: string, targetId: string, key: string, iv: string): Promise<void>;
}
//# sourceMappingURL=security.d.ts.map