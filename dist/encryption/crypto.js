"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoManager = void 0;
const crypto = __importStar(require("crypto"));
class CryptoManager {
    /**
     * Generate a random AES-256 key and IV
     */
    static generateKey() {
        return {
            key: crypto.randomBytes(32), // 256-bit key
            iv: crypto.randomBytes(16), // 128-bit IV
        };
    }
    /**
     * Encrypt text using AES-256-CBC
     */
    static encrypt(text, key, iv) {
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    /**
     * Decrypt text using AES-256-CBC
     */
    static decrypt(encryptedText, key, iv) {
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate RSA key pair
     */
    static generateRSAKeyPair() {
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
    static sign(data, privateKey) {
        const sign = crypto.createSign(this.RSA_ALGORITHM);
        sign.update(data);
        return sign.sign(privateKey, 'base64');
    }
    /**
     * Verify signature with RSA public key
     */
    static verifySignature(data, signature, publicKey) {
        const verify = crypto.createVerify(this.RSA_ALGORITHM);
        verify.update(data);
        return verify.verify(publicKey, signature, 'base64');
    }
    /**
     * Convert hex string to buffer
     */
    static hexToBuffer(hex) {
        return Buffer.from(hex, 'hex');
    }
    /**
     * Convert buffer to hex string
     */
    static bufferToHex(buffer) {
        return buffer.toString('hex');
    }
    /**
     * Convert base64 string to buffer
     */
    static base64ToBuffer(base64) {
        return Buffer.from(base64, 'base64');
    }
    /**
     * Convert buffer to base64 string
     */
    static bufferToBase64(buffer) {
        return buffer.toString('base64');
    }
}
exports.CryptoManager = CryptoManager;
CryptoManager.ALGORITHM = 'aes-256-cbc';
CryptoManager.RSA_ALGORITHM = 'RSA-SHA256';
//# sourceMappingURL=crypto.js.map