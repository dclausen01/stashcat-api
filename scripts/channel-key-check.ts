/**
 * Research script: check whether Channel objects have a `key` field
 * (like Conversations do for E2E encryption).
 *
 * Logs in, gets channels for the first company, finds the first encrypted
 * channel, and dumps the full channel object + getChannelInfo() response.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { StashcatClient } from '../src/client/StashcatClient';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OUT = path.join(__dirname, '..', 'scripts', 'channel-key-check-out.txt');

async function main() {
  const lines: string[] = [];
  const log = (msg: string) => { lines.push(msg); console.log(msg); };

  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });

  log('=== Login ===');
  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    securityPassword: process.env.STASHCAT_PASSWORD!,
  });
  log(`Authenticated: ${client.isAuthenticated()}`);
  log(`E2E unlocked: ${client.isE2EUnlocked()}`);

  log('\n=== Get Companies ===');
  const companies = await client.getCompanies();
  log(`Found ${companies.length} companies`);
  if (companies.length === 0) {
    log('No companies found, aborting.');
    fs.writeFileSync(OUT, lines.join('\n'));
    return;
  }
  const company = companies[0];
  log(`Using company: ${company.name} (id=${company.id})`);

  log('\n=== Get Channels ===');
  const channels = await client.getChannels(company.id);
  log(`Found ${channels.length} channels total`);

  // List all channels with their encrypted flag
  for (const ch of channels) {
    log(`  - [${ch.id}] "${ch.name}" encrypted=${ch.encrypted} hasKey=${'key' in (ch as any)} key=${(ch as any).key !== undefined ? String((ch as any).key).substring(0, 40) + '...' : 'undefined'}`);
  }

  // Find first encrypted channel
  const encChannel = channels.find(ch => ch.encrypted);
  if (!encChannel) {
    log('\nNo encrypted channel found. Picking first channel instead for inspection.');
    if (channels.length === 0) {
      log('No channels at all, aborting.');
      fs.writeFileSync(OUT, lines.join('\n'));
      return;
    }
  }

  const targetChannel = encChannel || channels[0];
  log(`\n=== Full Channel Object (from getChannels list) ===`);
  log(`Channel: "${targetChannel.name}" (id=${targetChannel.id})`);
  log(JSON.stringify(targetChannel, null, 2));

  log('\n=== getChannelInfo() Response ===');
  try {
    const info = await client.getChannelInfo(targetChannel.id, false);
    log(JSON.stringify(info, null, 2));

    // Explicitly check for key-related fields
    log('\n=== Key Field Analysis ===');
    const infoAny = info as any;
    log(`info.key = ${JSON.stringify(infoAny.key)}`);
    log(`info.encryption_key = ${JSON.stringify(infoAny.encryption_key)}`);
    log(`info.e2e_key = ${JSON.stringify(infoAny.e2e_key)}`);
    log(`info.encrypted = ${JSON.stringify(infoAny.encrypted)}`);

    // Also dump all keys of the object
    log(`\nAll keys in channelInfo: ${Object.keys(info).join(', ')}`);
  } catch (error) {
    log(`Error getting channel info: ${error instanceof Error ? error.message : error}`);
  }

  // If we had an encrypted channel, also check a non-encrypted one for comparison
  if (encChannel && channels.length > 1) {
    const nonEncChannel = channels.find(ch => !ch.encrypted);
    if (nonEncChannel) {
      log(`\n=== Non-encrypted channel for comparison ===`);
      log(`Channel: "${nonEncChannel.name}" (id=${nonEncChannel.id})`);
      try {
        const info2 = await client.getChannelInfo(nonEncChannel.id, false);
        log(`All keys: ${Object.keys(info2).join(', ')}`);
        log(`key = ${JSON.stringify((info2 as any).key)}`);
        log(`encryption_key = ${JSON.stringify((info2 as any).encryption_key)}`);
      } catch (error) {
        log(`Error: ${error instanceof Error ? error.message : error}`);
      }
    }
  }

  log('\n=== Done ===');
  client.logout();

  fs.writeFileSync(OUT, lines.join('\n'));
  log(`\nOutput written to ${OUT}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  fs.writeFileSync(OUT, `Fatal error: ${err.message || err}`);
  process.exit(1);
});
