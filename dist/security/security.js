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
exports.SecurityManager = void 0;
const crypto = __importStar(require("crypto"));
class SecurityManager {
    constructor(api) {
        this.api = api;
        /** Cache: conversation/channel id → decrypted AES key Buffer */
        this.aesKeyCache = new Map();
    }
    /**
     * Retrieve the encrypted private key from the server.
     */
    async getPrivateKey() {
        const data = this.api.createAuthenticatedRequestData({});
        try {
            const response = await this.api.post('/security/get_private_key', data);
            return response;
        }
        catch (error) {
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
    async unlockPrivateKey(securityPassword) {
        const response = await this.getPrivateKey();
        const keyData = response.keys;
        // private_key is a JSON-encoded string: { "private": "-----BEGIN ENCRYPTED PRIVATE KEY-----..." }
        let parsed;
        try {
            parsed = JSON.parse(keyData.private_key);
        }
        catch {
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
        }
        catch (error) {
            throw new Error(`Failed to decrypt RSA private key — check security password: ${error instanceof Error ? error.message : error}`);
        }
        this.aesKeyCache.clear();
    }
    /** Returns true if the RSA private key has been unlocked. */
    isUnlocked() {
        return !!this.rsaPrivateKey;
    }
    /**
     * RSA-OAEP decrypt a conversation/channel AES key.
     * @param encryptedKeyBase64 The base64-encoded RSA-encrypted AES key from conversation.key
     * @param cacheId Optional cache identifier (e.g. conversation/channel id)
     * @returns 32-byte AES key Buffer
     */
    decryptConversationKey(encryptedKeyBase64, cacheId) {
        if (!this.rsaPrivateKey) {
            throw new Error('E2E not unlocked — call unlockE2E() first');
        }
        if (cacheId) {
            const cached = this.aesKeyCache.get(cacheId);
            console.log(`[decryptConversationKey] cacheId=${cacheId} cacheHit=${!!cached} cacheSize=${this.aesKeyCache.size}`);
            if (cached)
                return cached;
        }
        const encryptedBuffer = Buffer.from(encryptedKeyBase64, 'base64');
        let aesKey;
        try {
            aesKey = crypto.privateDecrypt({ key: this.rsaPrivateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, encryptedBuffer);
        }
        catch (error) {
            throw new Error(`Failed to decrypt conversation AES key: ${error instanceof Error ? error.message : error}`);
        }
        if (cacheId) {
            this.aesKeyCache.set(cacheId, aesKey);
        }
        return aesKey;
    }
    /** Clear the AES key cache (e.g. after logout) */
    clearKeyCache() {
        this.aesKeyCache.clear();
        this.rsaPrivateKey = undefined;
    }
    /**
     * Set file access key (grants access to an encrypted file for a target user/channel)
     */
    async setFileAccessKey(fileId, target, targetId, key, iv) {
        const data = this.api.createAuthenticatedRequestData({
            file_id: fileId,
            target,
            target_id: targetId,
            key,
            iv,
        });
        try {
            await this.api.post('/security/set_file_access_key', data);
        }
        catch (error) {
            throw new Error(`Failed to set file access key: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.SecurityManager = SecurityManager;
//# sourceMappingURL=security.js.map