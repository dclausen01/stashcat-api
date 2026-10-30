import * as crypto from 'crypto';
import { describe, it, expect, jest } from '@jest/globals';
import { MessageManager } from '../../src/chats/messages';
import { StashcatAPI } from '../../src/api/request';
import { StashcatClient, decryptFileKeyEntry } from '../../src/client/StashcatClient';

function aes(data: Buffer, key: Buffer, iv: Buffer): Buffer {
  const c = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([c.update(data), c.final()]);
}

const chatKey = crypto.randomBytes(32);
const fileKey = crypto.randomBytes(32);
const keyIv = crypto.randomBytes(16);
const fileIv = crypto.randomBytes(16);
// Binärdaten inkl. ungültigem UTF-8 — daran ist die alte Implementierung gescheitert
const content = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from([0x00, 0xff, 0xfe, 0x80, 0xc3])]);
const encryptedContent = aes(content, fileKey, fileIv);
const keyEntry = { chat_id: '42', type: 'conversation', key: aes(fileKey, chatKey, keyIv).toString('hex'), iv: keyIv.toString('hex') };

function makeApi(binary: Buffer): StashcatAPI {
  const api = Object.create(StashcatAPI.prototype) as StashcatAPI;
  (api as any).downloadBinary = jest.fn(async () => binary);
  (api as any).createAuthenticatedRequestData = (params: Record<string, unknown>) => params;
  return api;
}

describe('decryptFileKeyEntry', () => {
  it('entschlüsselt den Dateischlüssel mit dem Chat-Schlüssel (hex und base64)', () => {
    expect(decryptFileKeyEntry(keyEntry, chatKey).equals(fileKey)).toBe(true);
    const b64 = { ...keyEntry, key: aes(fileKey, chatKey, keyIv).toString('base64') };
    expect(decryptFileKeyEntry(b64, chatKey).equals(fileKey)).toBe(true);
  });
});

describe('MessageManager.downloadFile', () => {
  it('entschlüsselt Binärdaten verlustfrei mit dem Dateischlüssel', async () => {
    const manager = new MessageManager(makeApi(encryptedContent));
    const out = await manager.downloadFile({ id: '1', encrypted: true, e2e_iv: fileIv.toString('hex') }, fileKey);
    expect(out.equals(content)).toBe(true);
  });

  it('liefert ohne Schlüssel die Rohdaten', async () => {
    const manager = new MessageManager(makeApi(encryptedContent));
    expect((await manager.downloadFile({ id: '1', encrypted: true, e2e_iv: 'aa' })).equals(encryptedContent)).toBe(true);
  });
});

describe('StashcatClient.downloadFile (automatische Entschlüsselung)', () => {
  function makeClient(): StashcatClient {
    const client = Object.create(StashcatClient.prototype) as StashcatClient;
    (client as any).requireAuth = () => undefined;
    (client as any).security = { isUnlocked: () => true, decryptConversationKey: jest.fn() };
    (client as any).messages = new MessageManager(makeApi(encryptedContent));
    (client as any).files = { getFileInfo: jest.fn(async () => ({ keys: [keyEntry], e2e_iv: fileIv.toString('hex') })) };
    (client as any).getConversationAesKey = jest.fn(async (id: string) => {
      if (id !== '42') throw new Error('falscher Chat');
      return chatKey;
    });
    return client;
  }

  it('holt Schlüssel und IV bei Bedarf aus /file/info', async () => {
    const out = await makeClient().downloadFile({ id: '1', encrypted: true });
    expect(out.equals(content)).toBe(true);
  });

  it('nutzt mitgelieferte keys und probiert weitere Einträge, wenn einer scheitert', async () => {
    const client = makeClient();
    const keys = [{ ...keyEntry, chat_id: '7' }, keyEntry];
    const out = await client.downloadFile({ id: '1', encrypted: true, e2e_iv: fileIv.toString('hex'), keys });
    expect(out.equals(content)).toBe(true);
    expect((client as any).files.getFileInfo).not.toHaveBeenCalled();
  });
});

describe('MessageManager.markAsRead', () => {
  it('ruft /message/content ab (es gibt kein /message/mark_read)', async () => {
    const post = jest.fn<() => Promise<unknown>>().mockResolvedValue({ messages: [] });
    const api = makeApi(Buffer.alloc(0));
    (api as any).post = post;
    await new MessageManager(api).markAsRead('5', 'channel', '99');
    expect(post).toHaveBeenCalledWith('/message/content', { channel_id: '5', source: 'channel', limit: 1, offset: 0 });
  });
});
