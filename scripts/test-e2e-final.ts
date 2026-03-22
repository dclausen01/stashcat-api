/**
 * Live-Test der E2E-Entschlüsselung über StashcatClient
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { StashcatClient } from '../src/client/StashcatClient';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OUT = path.join(__dirname, '..', 'test-e2e-final-out.txt');

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
    securityPassword: process.env.STASHCAT_PASSWORD!, // gleich wie Login-PW
  });
  log(`Authenticated: ${client.isAuthenticated()}`);
  log(`E2E unlocked: ${client.isE2EUnlocked()}`);

  log('\n=== Conversations ===');
  const convs = await client.getConversations({ limit: 5 });
  const encConv = convs.find(c => c.encrypted && c.key);
  if (!encConv) {
    log('No encrypted conversation found!');
    fs.writeFileSync(OUT, lines.join('\n'));
    return;
  }
  log(`Found encrypted conversation: ${encConv.id}`);

  log('\n=== Get Messages (auto-decrypt) ===');
  const msgs = await client.getMessages(String(encConv.id), 'conversation', { limit: 3 });
  log(`Got ${msgs.length} messages`);
  for (const m of msgs) {
    const preview = String(m.text || '').slice(0, 80);
    log(`  [${m.id}] encrypted=${m.encrypted} | text: "${preview}"`);
  }

  log('\n=== getConversationAesKey ===');
  const aesKey = await client.getConversationAesKey(String(encConv.id));
  log(`AES key (hex): ${aesKey.toString('hex')}`);

  log('\n=== Done ===');
  fs.writeFileSync(OUT, lines.join('\n'));
}

main().catch(err => {
  const msg = `FATAL: ${err.message}\n${err.stack}`;
  fs.writeFileSync(OUT, msg);
  console.error(msg);
});
