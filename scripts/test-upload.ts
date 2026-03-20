/**
 * Testet File-Upload in den Kanal "Notizen_ClauD":
 *  1. Erstellt eine kleine Testdatei
 *  2. Lädt sie in den Channel hoch
 *  3. Sendet eine Nachricht mit dem Dateianhang
 *  4. Liest die letzten Nachrichten zurück und zeigt files-Felder
 */

import * as fs from 'fs';
import * as path from 'path';
import { getClient, saveSession } from './session-store';

const COMPANY_ID = '68956';
const TARGET_CHANNEL = 'Notizen_ClauD';

async function main() {
  const { client, companyId } = await getClient();
  const effectiveCompanyId = companyId || COMPANY_ID;

  // Kanal finden
  console.log(`\nLade Channels für Company ${effectiveCompanyId}…`);
  const channels = await client.getChannels(effectiveCompanyId);
  const target = channels.find(ch => ch.name === TARGET_CHANNEL);
  if (!target) {
    console.error(`Kanal "${TARGET_CHANNEL}" nicht gefunden.`);
    process.exit(1);
  }
  console.log(`Kanal gefunden: "${target.name}" (id=${target.id})`);

  // Testdatei erstellen
  const tmpFile = path.join(__dirname, '..', 'test-upload-tmp.txt');
  fs.writeFileSync(tmpFile, `Stashcat API Upload-Test\nZeitstempel: ${new Date().toISOString()}\n`);
  console.log(`\nTestdatei erstellt: ${tmpFile}`);

  try {
    // 1. Upload
    console.log('\n[1] Lade Datei hoch…');
    const uploaded = await client.uploadFile(tmpFile, {
      type: 'channel',
      type_id: target.id,
    });
    console.log(`Upload OK! id=${uploaded.id}, name="${uploaded.name}", size=${uploaded.size}`);

    // 2. Nachricht mit Dateianhang senden
    console.log('\n[2] Sende Nachricht mit Dateianhang…');
    const msg = await client.sendMessage({
      target: target.id,
      target_type: 'channel',
      text: 'Automatischer Test mit Dateianhang',
      files: [uploaded.id],
    });
    console.log(`Nachricht gesendet! id=${msg.id}`);
    console.log(`  text:  "${msg.text}"`);
    console.log(`  files: ${JSON.stringify(msg.files ?? [])}`);

    // 3. Letzte 5 Nachrichten lesen und files-Felder zeigen
    console.log('\n[3] Lese letzte 5 Nachrichten…');
    const messages = await client.getMessages(target.id, 'channel', { limit: 5 });
    for (const m of messages) {
      const sender = typeof m.sender === 'string' ? m.sender : (m.sender as any)?.name ?? '?';
      const filesInfo = m.files && m.files.length > 0
        ? `  → files: ${m.files.map(f => `${f.name}(${f.id})`).join(', ')}`
        : '';
      console.log(`  [${m.id}] "${(m.text ?? '').slice(0, 60)}" — ${sender}${filesInfo}`);
    }

    // companyId für künftige Läufe speichern
    saveSession(client, { companyId: effectiveCompanyId });

  } finally {
    // Testdatei aufräumen
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

main().catch(err => {
  console.error('Fehler:', err instanceof Error ? err.message : err);
  process.exit(1);
});
