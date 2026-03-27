export interface EncryptionKey {
    key: Buffer;
    iv: Buffer;
}
export declare class CryptoManager {
    private static readonly ALGORITHM;
    private static readonly RSA_ALGORITHM;
    /**
     * Generate a random AES-256 key and IV
     */
    static generateKey(): EncryptionKey;
    /**
     * Encrypt text using AES-256-CBC
     */
    static encrypt(text: string, key: Buffer, iv: Buffer): string;
    /**
     * Decrypt text using AES-256-CBC
     */
    static decrypt(encryptedText: string, key: Buffer, iv: Buffer): string;
    /**
     * Generate RSA key pair
     */
    static generateRSAKeyPair(): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * Sign data with RSA private key
     */
    static sign(data: string, privateKey: string): string;
    /**
     * Verify signature with RSA public key
     */
    static verifySignature(data: string, signature: string, publicKey: string): boolean;
    /**
     * Convert hex string to buffer
     */
    static hexToBuffer(hex: string): Buffer;
    /**
     * Convert buffer to hex string
     */
    static bufferToHex(buffer: Buffer): string;
    /**
     * Convert base64 string to buffer
     */
    static base64ToBuffer(base64: string): Buffer;
    /**
     * Convert buffer to base64 string
     */
    static bufferToBase64(buffer: Buffer): string;
}
//# sourceMappingURL=crypto.d.ts.map