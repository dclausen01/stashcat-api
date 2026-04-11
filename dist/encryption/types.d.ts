/**
 * Types for device-to-device E2E key transfer and encryption operations.
 */
/**
 * Response from /security/get_private_key with type=signing
 * Contains AES-encrypted private key components for device transfer.
 */
export interface SigningKeyData {
    user_id: string;
    type: 'signing';
    format: 'jwk';
    /** JSON-encoded object containing encrypted key components */
    private_key: string;
    /** JWK public key */
    public_key: string;
    public_key_signature: string | null;
    time: string;
    deleted: string | null;
    version: number;
}
/**
 * Parsed structure of private_key field from SigningKeyData
 */
export interface EncryptedSigningKey {
    /** AES-256-CBC encrypted private key JWK (base64) */
    ciphertext: string;
    /** AES IV (base64) */
    iv: string;
    /** The KEK encrypted with the 6-digit code (base64) */
    encryptedKEK: string;
    /** Always 'aes-256-cbc' */
    encryption_func: 'aes-256-cbc';
}
/**
 * Response from /security/get_master_encryption_key
 * Contains the master key used for encrypting the KEK during transfer.
 */
export interface MasterEncryptionKeyResponse {
    master_encryption_key: {
        ciphertext: string;
        signature: string;
    };
}
/**
 * Response from /security/get_verified_keys
 * Contains key fingerprints for verification.
 */
export interface VerifiedKeysResponse {
    fingerprints: string[];
}
/**
 * Options for initiating a key transfer to another device
 */
export interface KeyTransferOptions {
    /** The target device ID to receive the key */
    targetDeviceId: string;
    /** Optional callback when the 6-digit code is generated */
    onCodeGenerated?: (code: string) => void;
}
/**
 * JWK (JSON Web Key) structure for RSA private key
 */
export interface RsaPrivateKeyJwk {
    kty: 'RSA';
    /** Private exponent */
    d?: string;
    /** First prime factor */
    p?: string;
    /** Second prime factor */
    q?: string;
    /** First factor CRT exponent */
    dp?: string;
    /** Second factor CRT exponent */
    dq?: string;
    /** CRT coefficient */
    qi?: string;
    /** Modulus - also present in public key */
    n?: string;
    /** Public exponent */
    e?: string;
    /** Key ID */
    kid?: string;
    alg?: string;
    ext?: boolean;
    key_ops?: string[];
    [key: string]: unknown;
}
/**
 * Result of a completed key transfer
 */
export interface KeyTransferResult {
    success: boolean;
    /** The decrypted private key as JWK */
    privateKey?: RsaPrivateKeyJwk;
    /** Error message if transfer failed */
    error?: string;
}
/**
 * Device information for key transfer
 * Extended ActiveDevice with key transfer support flag
 */
export interface DeviceWithKeyTransfer {
    id: string;
    device_id: string;
    app_name: string;
    name?: string;
    last_login?: string;
    last_request?: string;
    key_transfer_support: boolean;
    encryption: boolean;
    is_fully_authed: boolean;
}
//# sourceMappingURL=types.d.ts.map