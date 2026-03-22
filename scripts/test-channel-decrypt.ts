/**
 * Test: Channel message decryption via getMessages()
 * Verifies that the fix for channel E2E decryption works.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { StashcatClient } from '../src/client/StashcatClient';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OUT = path.join(__dirname, 'test-channel-decrypt-out.txt');

async function main() {
  const lines: string[] = [];
  const log = (msg: string) => { lines.push(msg); };

  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });

  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    securityPassword: process.env.STASHCAT_PASSWORD!,
  });
  log(`Auth: ${client.isAuthenticated()}, E2E: ${client.isE2EUnlocked()}`);

  // Get first encrypted channel
  const companies = await client.getCompanies();
  const channels = await client.getChannels(companies[0].id);
  const encChannel = channels.find(ch => ch.encrypted && ch.key);

  if (!encChannel) {
    log('No encrypted channel found!');
    fs.writeFileSync(OUT, lines.join('\n'));
    return;
  }

  log(`\nChannel: "${encChannel.name}" (id=${encChannel.id})`);

  // Get messages — should now auto-decrypt
  const messages = await client.getMessages(String(encChannel.id), 'channel', { limit: 5 });

  log(`\nMessages (${messages.length}):`);
  for (const msg of messages) {
    const sender = typeof msg.sender === 'object' ? `${msg.sender.first_name} ${msg.sender.last_name}` : msg.sender;
    const hasOriginal = !!msg.original_text;
    log(`  [${msg.id}] encrypted=${msg.encrypted} decrypted=${hasOriginal} sender="${sender}"`);
    log(`    text: ${msg.text?.substring(0, 120)}${(msg.text?.length || 0) > 120 ? '...' : ''}`);
    if (hasOriginal) {
      log(`    original_text (first 60 hex): ${msg.original_text?.substring(0, 60)}...`);
    }
  }

  // Also test a non-encrypted channel for comparison
  const plainChannel = channels.find(ch => !ch.encrypted);
  if (plainChannel) {
    log(`\n--- Non-encrypted channel: "${plainChannel.name}" ---`);
    const plainMsgs = await client.getMessages(String(plainChannel.id), 'channel', { limit: 2 });
    for (const msg of plainMsgs) {
      log(`  [${msg.id}] encrypted=${msg.encrypted} text: ${msg.text?.substring(0, 80)}`);
    }
  }

  client.logout();
  log('\nDone!');
  fs.writeFileSync(OUT, lines.join('\n'));
}

main().catch(err => {
  fs.writeFileSync(OUT, `Fatal: ${err.message}\n${err.stack}`);
});
