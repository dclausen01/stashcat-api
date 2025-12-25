import * as crypto from 'crypto';

export interface EncryptionKey {
  key: Buffer;
  iv: Buffer;
}

export class CryptoManager {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly RSA_ALGORITHM = 'RSA-SHA256';

  /**
   * Generate a random AES-256 key and IV
   */
  static generateKey(): EncryptionKey {
    return {
      key: crypto.randomBytes(32), // 256-bit key
      iv: crypto.randomBytes(16),  // 128-bit IV
    };
  }

  /**
   * Encrypt text using AES-256-CBC
   */
  static encrypt(text: string, key: Buffer, iv: Buffer): string {
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt text using AES-256-CBC
   */
  static decrypt(encryptedText: string, key: Buffer, iv: Buffer): string {
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate RSA key pair
   */
  static generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * Sign data with RSA private key
   */
  static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign(this.RSA_ALGORITHM);
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify signature with RSA public key
   */
  static verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify(this.RSA_ALGORITHM);
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  }

  /**
   * Convert hex string to buffer
   */
  static hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  }

  /**
   * Convert buffer to hex string
   */
  static bufferToHex(buffer: Buffer): string {
    return buffer.toString('hex');
  }

  /**
   * Convert base64 string to buffer
   */
  static base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
  }

  /**
   * Convert buffer to base64 string
   */
  static bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }
}
