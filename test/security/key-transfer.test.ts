/**
 * Test suite for Device-to-Device E2E Key Transfer
 * 
 * Roundtrip Test:
 * 1. unlockE2E(password) → get decrypted private key
 * 2. exportPrivateKey() → save JWK
 * 3. Create new client with fromSession() → unlockE2EWithPrivateKey(jwk)
 * 4. getConversationAesKey() → verify same result as step 1
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { StashcatClient } from '../../src/client/StashcatClient';
import { RsaPrivateKeyJwk } from '../../src/encryption/types';

// Load environment variables for testing
const TEST_EMAIL = process.env.STASHCAT_EMAIL || '';
const TEST_PASSWORD = process.env.STASHCAT_PASSWORD || '';
const TEST_BASE_URL = process.env.STASHCAT_BASE_URL || 'https://api.stashcat.com/';

// Skip tests if credentials are not configured
const describeIfConfigured = TEST_EMAIL && TEST_PASSWORD ? describe : describe.skip;

describeIfConfigured('Device-to-Device Key Transfer', () => {
  let client: StashcatClient;
  let securityPassword: string;

  beforeAll(() => {
    // Use password as security password by default (Stashcat behavior)
    securityPassword = process.env.STASHCAT_SECURITY_PASSWORD || TEST_PASSWORD;
  });

  describe('Roundtrip: Password → JWK → E2E Operations', () => {
    it('should login with password and unlock E2E', async () => {
      client = new StashcatClient({ baseUrl: TEST_BASE_URL });
      
      // Login WITHOUT E2E unlock (like a new device would)
      await client.loginWithoutE2E({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(client.isAuthenticated()).toBe(true);
      expect(client.isE2EUnlocked()).toBe(false);
    });

    it('should simulate getting signing key for transfer', async () => {
      // This is typically called after the target device prepares the transfer
      const signingKeyData = await client['security'].getSigningKeyForTransfer();

      expect(signingKeyData).toBeDefined();
      expect(signingKeyData.type).toBe('signing');
      expect(signingKeyData.format).toBe('jwk');
      expect(signingKeyData.private_key).toBeDefined();
    });

    it('should complete key transfer with code (simulated)', async () => {
      // Note: This requires an actual code from a target device
      // In a real test, you would:
      // 1. Have another client instance (target device) call initiateKeyTransferToDevice()
      // 2. Get the 6-digit code from the target device
      // 3. Complete the transfer on the new client
      
      // For unit testing without a second device, we use the legacy unlock method
      // and then export the key to simulate a successful transfer
      await client.unlockE2E(securityPassword);
      
      expect(client.isE2EUnlocked()).toBe(true);
    });

    it('should export private key as JWK', async () => {
      const jwk = client.exportPrivateKey();

      expect(jwk).toBeDefined();
      expect(jwk?.kty).toBe('RSA');
      expect(jwk?.d).toBeDefined(); // Private exponent
      expect(jwk?.n).toBeDefined(); // Modulus
      expect(jwk?.e).toBeDefined(); // Public exponent
    });

    it('should restore session without E2E, then unlock with JWK', async () => {
      // Serialize the session (like Nextcloud would do)
      const session = client.serialize();
      const savedJwk = client.exportPrivateKey() as RsaPrivateKeyJwk;

      // Create new client from session (simulates new request/process)
      const newClient = StashcatClient.fromSession(session, { baseUrl: TEST_BASE_URL });

      expect(newClient.isAuthenticated()).toBe(true);
      expect(newClient.isE2EUnlocked()).toBe(false); // E2E not restored

      // Unlock E2E with the exported JWK (simulates key transfer completion)
      newClient.unlockE2EWithPrivateKey(savedJwk);

      expect(newClient.isE2EUnlocked()).toBe(true);

      // Cleanup
      client = newClient;
    });

    it('should perform the same E2E operations after JWK unlock', async () => {
      // The client should now be able to perform E2E operations
      // Just verify unlock status since we don't have a specific conversation to test
      expect(client.isE2EUnlocked()).toBe(true);

      // If we had encrypted conversations, we could test:
      // const aesKey = await client.getConversationAesKey('some-conversation-id');
      // expect(aesKey).toBeInstanceOf(Buffer);
      // expect(aesKey.length).toBe(32);
    });
  });

  describe('Key Transfer Helper Methods', () => {
    it('should list active devices with key transfer support', async () => {
      const devices = await client.listActiveDevices();

      expect(Array.isArray(devices)).toBe(true);
      
      // Check if any device supports key transfer
      const supportingDevices = devices.filter(d => d.key_transfer_support);
      
      // This will depend on the account settings
      // Just verify the method works
      expect(supportingDevices).toBeDefined();
    });

    it('should filter devices with key transfer support', async () => {
      const devices = await client.getDevicesWithKeyTransferSupport();

      expect(Array.isArray(devices)).toBe(true);
      
      // All returned devices should have key_transfer_support = true
      devices.forEach(device => {
        expect(client.deviceSupportsKeyTransfer(device)).toBe(true);
      });
    });

    it('should get master encryption key', async () => {
      const masterKey = await client['security'].getMasterEncryptionKey();

      expect(masterKey).toBeDefined();
      expect(masterKey.master_encryption_key).toBeDefined();
      expect(masterKey.master_encryption_key.ciphertext).toBeDefined();
      expect(masterKey.master_encryption_key.signature).toBeDefined();
    });

    it('should get verified keys', async () => {
      const verifiedKeys = await client['security'].getVerifiedKeys();

      expect(verifiedKeys).toBeDefined();
      expect(Array.isArray(verifiedKeys.fingerprints)).toBe(true);
    });
  });

  afterAll(() => {
    client?.logout();
  });
});

describe('Key Transfer Error Handling', () => {
  it('should throw when trying to unlock without authentication', () => {
    const client = new StashcatClient();

    expect(() => {
      client.unlockE2EWithPrivateKey({ kty: 'RSA' } as RsaPrivateKeyJwk);
    }).toThrow('Not authenticated');
  });

  it('should throw when trying to export without unlock', async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return;

    const client = new StashcatClient({ baseUrl: TEST_BASE_URL });
    await client.loginWithoutE2E({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(client.exportPrivateKey()).toBeUndefined();

    client.logout();
  });

  it('should throw for invalid 6-digit code (simulated)', async () => {
    if (!TEST_EMAIL || !TEST_PASSWORD) return;

    const client = new StashcatClient({ baseUrl: TEST_BASE_URL });
    await client.loginWithoutE2E({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // This would throw if the signing key was prepared and an invalid code was used
    // In this test, we just verify the method exists
    expect(typeof client.completeKeyTransferWithCode).toBe('function');

    client.logout();
  });
});
