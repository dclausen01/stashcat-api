import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { StashcatClient } from '../src/index';

dotenv.config();

const OUT = 'scripts/run-stdout.txt';
const log = (msg: string) => fs.appendFileSync(OUT, msg + '\n');

async function main() {
  fs.writeFileSync(OUT, '');

  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });

  log('Logging in...');
  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-test',
  });
  log('Login OK\n');

  // ── Persönliche Dateien ──────────────────────────────────────────────────
  log('=== Persönliche Dateien (type=personal) ===');
  try {
    const content = await client.listPersonalFiles({ limit: 20 });
    log(`Ordner: ${content.folder.length}, Dateien: ${content.files.length}`);
    for (const f of content.folder.slice(0, 5)) {
      log(`  [Ordner] ${f.name} (id=${f.id}, ${f.size_byte} bytes)`);
    }
    for (const f of content.files.slice(0, 5)) {
      log(`  [Datei]  ${f.name} (id=${f.id}, ${f.size_string})`);
    }
  } catch (e) {
    log(`FEHLER: ${e instanceof Error ? e.message : e}`);
  }

  // ── Channel-Dateien ──────────────────────────────────────────────────────
  const channelId = '3279211'; // Notizen_ClauD
  log(`\n=== Channel-Dateien für Channel ${channelId} ===`);
  try {
    const content = await client.listFolder({ type: 'channel', type_id: channelId, limit: 20 });
    log(`Ordner: ${content.folder.length}, Dateien: ${content.files.length}`);
    for (const f of content.folder.slice(0, 5)) {
      log(`  [Ordner] ${f.name} (id=${f.id})`);
    }
    for (const f of content.files.slice(0, 5)) {
      log(`  [Datei]  ${f.name} (id=${f.id}, ${f.size_string})`);
    }
  } catch (e) {
    log(`FEHLER: ${e instanceof Error ? e.message : e}`);
  }

  log('\nFertig.');
}

main().catch(e => {
  fs.appendFileSync(OUT, `\nFehler: ${e}\n`);
  process.exit(1);
});
