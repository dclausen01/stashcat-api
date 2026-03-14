/**
 * Stashcat API – Interaktives Test-Skript
 *
 * Führt alle implementierten API-Funktionen der Reihe nach aus und gibt
 * Ergebnisse übersichtlich im Terminal aus.
 *
 * Verwendung:
 *   cp .env.example .env          # Credentials eintragen
 *   npm run build
 *   npx ts-node scripts/test-api.ts
 *
 * Optionale ENV-Variablen für tiefere Tests:
 *   TEST_COMPANY_ID      – Company-ID für Channel-Tests
 *   TEST_CHANNEL_ID      – vorhandene Channel-ID
 *   TEST_CONVERSATION_ID – vorhandene Conversation-ID
 *   TEST_USER_ID         – User-ID für getUserInfo()
 *   TEST_UPLOAD_FILE     – lokaler Dateipfad für Upload-Test
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { StashcatClient } from '../src/index';

dotenv.config();

// ─── Hilfsfunktionen ────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

let passed = 0;
let failed = 0;
let skipped = 0;

function header(title: string) {
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`);
}

async function test<T>(
  name: string,
  fn: () => Promise<T>,
  display?: (result: T) => string
): Promise<T | undefined> {
  process.stdout.write(`  ${name} … `);
  try {
    const result = await fn();
    const info = display ? display(result) : '';
    console.log(`${GREEN}✓${RESET}${info ? ' ' + info : ''}`);
    passed++;
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`${RED}✗  ${msg}${RESET}`);
    failed++;
    return undefined;
  }
}

function skip(name: string, reason: string) {
  console.log(`  ${name} … ${YELLOW}⊘ ${reason}${RESET}`);
  skipped++;
}

function env(key: string): string | undefined {
  return process.env[key] || undefined;
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`ENV-Variable ${key} nicht gesetzt`);
  return v;
}

// ─── Hauptprogramm ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}Stashcat API – Testlauf${RESET}`);
  console.log(`Basis-URL: ${env('STASHCAT_BASE_URL') || 'https://api.stashcat.com/'}`);
  console.log(`Account:   ${env('STASHCAT_EMAIL') || '(nicht gesetzt)'}`);

  const client = new StashcatClient({
    baseUrl: env('STASHCAT_BASE_URL'),
    deviceId: env('STASHCAT_DEVICE_ID'),
  });

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  header('1 · Authentifizierung');

  const loginOk = await test('login()', async () => {
    await client.login({
      email:    requireEnv('STASHCAT_EMAIL'),
      password: requireEnv('STASHCAT_PASSWORD'),
      appName:  env('STASHCAT_APP_NAME') || 'stashcat-api-test',
    });
    return client.getClientInfo();
  }, r => `deviceId=${r.deviceId.slice(0, 8)}… encKey=${r.hasEncryptionKey}`);

  if (!loginOk) {
    console.log(`\n${RED}Login fehlgeschlagen – restliche Tests werden übersprungen.${RESET}`);
    process.exit(1);
  }

  // ── 2. Eigenes Profil ────────────────────────────────────────────────────
  header('2 · Eigenes Profil');

  const me = await test('getMe()', () => client.getMe(),
    u => `${u.first_name} ${u.last_name} <${u.email}>`);

  await test('getPrivateKey()', async () => {
    const r = await client.getPrivateKey();
    return r;
  }, r => `private_key vorhanden=${!!r.private_key}`);

  await test('getAccountSettings()', () => client.getAccountSettings(),
    s => `email=${s.email}`);

  await test('listActiveDevices()', async () => {
    const devices = await client.listActiveDevices();
    return devices;
  }, d => `${d.length} Gerät(e)`);

  await test('getNotificationCount()', async () => {
    const count = await client.getNotificationCount();
    return count;
  }, c => `${c} ungelesen`);

  await test('getNotifications(limit=5)', async () => {
    const notes = await client.getNotifications(5);
    return notes;
  }, n => `${n.length} Benachrichtigung(en)`);

  // ── 3. User-Suche ────────────────────────────────────────────────────────
  header('3 · Benutzer');

  const testUserId = env('TEST_USER_ID');
  if (testUserId) {
    await test(`getUserInfo(${testUserId})`, () => client.getUserInfo(testUserId),
      u => `${u.first_name} ${u.last_name}`);
  } else {
    skip('getUserInfo()', 'TEST_USER_ID nicht gesetzt');
  }

  const companyId = env('TEST_COMPANY_ID');
  if (companyId) {
    await test(`getCompanyMembers(${companyId})`, () => client.getCompanyMembers(companyId),
      m => `${m.length} Mitglieder`);
  } else {
    skip('getCompanyMembers()', 'TEST_COMPANY_ID nicht gesetzt');
  }

  // ── 4. Channels ──────────────────────────────────────────────────────────
  header('4 · Channels');

  let firstChannelId = env('TEST_CHANNEL_ID');

  if (companyId) {
    const channels = await test(`getChannels(${companyId})`, () => client.getChannels(companyId),
      c => `${c.length} Channel(s)`);

    if (channels && channels.length > 0 && !firstChannelId) {
      firstChannelId = channels[0].id;
    }

    await test(`getVisibleChannels(${companyId})`, () => client.getVisibleChannels(companyId),
      c => `${c.length} sichtbar`);
  } else {
    skip('getChannels()', 'TEST_COMPANY_ID nicht gesetzt');
    skip('getVisibleChannels()', 'TEST_COMPANY_ID nicht gesetzt');
  }

  if (firstChannelId) {
    await test(`getChannelInfo(${firstChannelId})`, () => client.getChannelInfo(firstChannelId!),
      c => `"${c.name}"`);

    await test(`getChannelMembers(${firstChannelId})`, () => client.getChannelMembers(firstChannelId!),
      m => `${m.length} Mitglieder`);

    const chMessages = await test(`getMessages(channel, limit=5)`,
      () => client.getMessages(firstChannelId!, 'channel', { limit: 5 }),
      m => `${m.length} Nachricht(en)`);

    if (chMessages && chMessages.length > 0) {
      const msg = chMessages[0];
      const sender = typeof msg.sender === 'string' ? msg.sender : msg.sender?.name ?? '?';
      console.log(`    └─ Letzte Nachricht: "${msg.text?.slice(0, 60)}" von ${sender}`);
    }

    // Quota
    await test(`getStorageQuota(channel)`, () => client.getStorageQuota('channel', firstChannelId!),
      q => q ? `${q.used}/${q.total} Bytes` : 'keine Daten');

    // Folder
    await test(`listFolder(channel)`,
      () => client.listFolder({ type: 'channel', type_id: firstChannelId! }),
      items => `${items.length} Einträge`);
  } else {
    skip('getChannelInfo()', 'Kein Channel verfügbar (TEST_CHANNEL_ID oder TEST_COMPANY_ID setzen)');
    skip('getChannelMembers()', 'Kein Channel verfügbar');
    skip('getMessages(channel)', 'Kein Channel verfügbar');
  }

  // ── 5. Conversations ─────────────────────────────────────────────────────
  header('5 · Conversations');

  let firstConvId = env('TEST_CONVERSATION_ID');

  const conversations = await test('getConversations(limit=10)',
    () => client.getConversations({ limit: 10 }),
    c => `${c.length} Conversation(s)`);

  if (conversations && conversations.length > 0 && !firstConvId) {
    firstConvId = conversations[0].id;
  }

  if (firstConvId) {
    await test(`getConversation(${firstConvId})`, () => client.getConversation(firstConvId!),
      c => `Typ=${c.type}`);

    const convMessages = await test('getMessages(conversation, limit=5)',
      () => client.getMessages(firstConvId!, 'conversation', { limit: 5 }),
      m => `${m.length} Nachricht(en)`);

    if (convMessages && convMessages.length > 0) {
      const msg = convMessages[0];
      const sender = typeof msg.sender === 'string' ? msg.sender : msg.sender?.name ?? '?';
      console.log(`    └─ Letzte Nachricht: "${msg.text?.slice(0, 60)}" von ${sender}`);
    }

    // Folder
    await test(`listFolder(conversation)`,
      () => client.listFolder({ type: 'conversation', type_id: firstConvId! }),
      items => `${items.length} Einträge`);
  } else {
    skip('getConversation()', 'Keine Conversation gefunden');
    skip('getMessages(conversation)', 'Keine Conversation gefunden');
  }

  // ── 6. Nachrichten senden & löschen ─────────────────────────────────────
  header('6 · Nachricht senden & löschen');

  if (firstConvId) {
    const sentMsg = await test('sendMessage() → Conversation',
      () => client.sendMessage({
        target:      firstConvId!,
        target_type: 'conversation',
        text:        `[Stashcat API Test] ${new Date().toISOString()}`,
      }),
      m => `id=${m.id}`);

    if (sentMsg) {
      await test(`likeMessage(${sentMsg.id})`, () => client.likeMessage(sentMsg.id));
      await test(`unlikeMessage(${sentMsg.id})`, () => client.unlikeMessage(sentMsg.id));
      await test(`flagMessage(${sentMsg.id})`, () => client.flagMessage(sentMsg.id));
      await test(`unflagMessage(${sentMsg.id})`, () => client.unflagMessage(sentMsg.id));
      await test(`deleteMessage(${sentMsg.id})`, () => client.deleteMessage(sentMsg.id));
    }

    await test('getFlaggedMessages(conversation)',
      () => client.getFlaggedMessages('conversation', firstConvId!, { limit: 5 }),
      m => `${m.length} markiert`);
  } else if (firstChannelId) {
    const sentMsg = await test('sendMessage() → Channel',
      () => client.sendMessage({
        target:      firstChannelId!,
        target_type: 'channel',
        text:        `[Stashcat API Test] ${new Date().toISOString()}`,
      }),
      m => `id=${m.id}`);

    if (sentMsg) {
      await test(`deleteMessage(${sentMsg.id})`, () => client.deleteMessage(sentMsg.id));
    }
  } else {
    skip('sendMessage()', 'Kein Conversation- oder Channel-Ziel verfügbar');
  }

  // ── 7. Datei-Upload ──────────────────────────────────────────────────────
  header('7 · Datei-Upload & -Download');

  const uploadTarget = firstConvId || firstChannelId;
  const uploadType   = firstConvId ? 'conversation' : 'channel';
  const uploadFile   = env('TEST_UPLOAD_FILE');

  if (uploadTarget && uploadFile) {
    if (!fs.existsSync(uploadFile)) {
      skip('uploadFile()', `Datei nicht gefunden: ${uploadFile}`);
    } else {
      const uploaded = await test(`uploadFile(${path.basename(uploadFile)})`,
        () => client.uploadFile(uploadFile, { type: uploadType, type_id: uploadTarget }),
        f => `id=${f.id} size=${f.size}`);

      if (uploaded) {
        await test(`getFileInfo(${uploaded.id})`, () => client.getFileInfo(uploaded.id),
          f => `"${f.name}"`);

        await test(`renameFile(${uploaded.id})`,
          () => client.renameFile(uploaded.id, `renamed_${path.basename(uploadFile)}`));

        await test(`deleteFiles([${uploaded.id}])`,
          () => client.deleteFiles([uploaded.id]));
      }
    }
  } else if (!uploadTarget) {
    skip('uploadFile()', 'Kein Upload-Ziel verfügbar');
  } else {
    skip('uploadFile()', 'TEST_UPLOAD_FILE nicht gesetzt (Pfad zu einer lokalen Datei angeben)');
  }

  // ── 8. Account-Aktionen (schreibend, optional) ───────────────────────────
  header('8 · Account (schreibend – nur mit TEST_RUN_WRITE=1)');

  const runWrite = env('TEST_RUN_WRITE') === '1';

  if (runWrite) {
    const currentStatus = me?.status ?? '';
    await test('changeStatus("Teste API…")', () => client.changeStatus('Teste API…'));
    await test(`changeStatus("${currentStatus}") [zurücksetzen]`,
      () => client.changeStatus(currentStatus));
  } else {
    skip('changeStatus()', 'TEST_RUN_WRITE=1 nicht gesetzt');
  }

  // ── 9. Verschlüsselung ───────────────────────────────────────────────────
  header('9 · Verschlüsselung (lokal, kein API-Aufruf)');

  await test('CryptoManager.generateKey()', async () => {
    const { CryptoManager } = await import('../src/encryption/crypto');
    const key = CryptoManager.generateKey();
    if (key.key.length !== 32) throw new Error('Schlüssel hat falsche Länge');
    if (key.iv.length  !== 16) throw new Error('IV hat falsche Länge');
    return key;
  }, k => `key=${k.key.length}B iv=${k.iv.length}B`);

  await test('AES-256-CBC encrypt → decrypt Roundtrip', async () => {
    const { CryptoManager } = await import('../src/encryption/crypto');
    const { key, iv } = CryptoManager.generateKey();
    const plain     = 'Hallo, Stashcat!';
    const encrypted = CryptoManager.encrypt(plain, key, iv);
    const decrypted = CryptoManager.decrypt(encrypted, key, iv);
    if (decrypted !== plain) throw new Error(`Mismatch: "${decrypted}"`);
    return { plain, encrypted };
  }, r => `"${r.plain}" → "${r.encrypted.slice(0, 20)}…"`);

  await test('RSA-2048 Schlüsselpaar + Signatur', async () => {
    const { CryptoManager } = await import('../src/encryption/crypto');
    const { publicKey, privateKey } = CryptoManager.generateRSAKeyPair();
    const data      = 'Testdaten';
    const signature = CryptoManager.sign(data, privateKey);
    const valid     = CryptoManager.verifySignature(data, signature, publicKey);
    if (!valid) throw new Error('Signaturverifikation fehlgeschlagen');
    return valid;
  }, () => 'Signatur gültig');

  // ── 10. Logout ───────────────────────────────────────────────────────────
  header('10 · Logout');

  await test('logout()', async () => {
    client.logout();
    return client.isAuthenticated();
  }, auth => `isAuthenticated=${auth}`);

  // ── Zusammenfassung ──────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log(`\n${BOLD}━━━ Ergebnis ━━━${RESET}`);
  console.log(`  ${GREEN}✓ Bestanden:    ${passed}${RESET}`);
  console.log(`  ${RED}✗ Fehlgeschlagen: ${failed}${RESET}`);
  console.log(`  ${YELLOW}⊘ Übersprungen: ${skipped}${RESET}`);
  console.log(`  Gesamt:          ${total}`);

  if (failed > 0) {
    console.log(`\n${RED}${BOLD}Es gab Fehler.${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}${BOLD}Alle Tests bestanden.${RESET}`);
  }
}

main().catch(err => {
  console.error(`\n${RED}Unerwarteter Fehler:${RESET}`, err);
  process.exit(1);
});
