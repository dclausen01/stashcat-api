/**
 * Testet:
 *  1. listFolder() auf Channel "Notizen_ClauD" (bugfix: folder_only, sorting, content.file)
 *  2. File-Download einer bekannten Datei
 */

import * as fs from 'fs';
import * as path from 'path';
import { getClient, saveSession } from './session-store';

const OUT = path.join(__dirname, '..', 'test-folder-download-out.txt');
const lines: string[] = [];
const log = (...args: unknown[]) => {
  const line = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
  lines.push(line);
  console.log(line);
};

const COMPANY_ID = '68956';
const CHANNEL_ID = '3279211'; // Notizen_ClauD

async function main() {
  const { client } = await getClient();

  // ── 1. listFolder ────────────────────────────────────────────────────────
  log('\n=== 1. listFolder(channel, Notizen_ClauD) ===');
  const content = await client.listFolder({ type: 'channel', type_id: CHANNEL_ID });
  log(`Ordner:  ${content.folder.length}`);
  log(`Dateien: ${content.files.length}`);
  if (content.folder.length > 0) {
    log('Erster Ordner:', content.folder[0]);
  }
  if (content.files.length > 0) {
    log('Erste Datei:', content.files[0]);
  } else {
    log('Keine Dateien im Root-Ordner.');
  }

  // ── 2. Upload einer kleinen Datei ────────────────────────────────────────
  log('\n=== 2. Upload Testdatei ===');
  const tmpFile = path.join(__dirname, '..', 'dl-test-tmp.txt');
  fs.writeFileSync(tmpFile, `Download-Test ${new Date().toISOString()}\n`);
  const uploaded = await client.uploadFile(tmpFile, { type: 'channel', type_id: CHANNEL_ID });
  log(`Upload OK: id=${uploaded.id} name="${uploaded.name}" size=${uploaded.size}`);
  fs.unlinkSync(tmpFile);

  // ── 3. Ordner nach Upload neu laden ─────────────────────────────────────
  log('\n=== 3. listFolder nach Upload ===');
  const content2 = await client.listFolder({ type: 'channel', type_id: CHANNEL_ID });
  log(`Ordner:  ${content2.folder.length}`);
  log(`Dateien: ${content2.files.length}`);
  const found = content2.files.find(f => f.id === uploaded.id);
  log(`Hochgeladene Datei in Listing gefunden: ${!!found}`);
  if (found) log('Datei-Eintrag:', found);

  // ── 4. File-Download ─────────────────────────────────────────────────────
  log('\n=== 4. File-Download ===');
  // Wir brauchen ein FileInfo-Objekt (mit encrypted-Flag) für downloadFile
  const fileInfo = await client.getFileInfo(uploaded.id);
  log('FileInfo:', fileInfo);

  const downloadedBuffer = await client.downloadFile(fileInfo);
  const downloadedText = downloadedBuffer.toString('utf-8');
  log(`Download OK! Bytes: ${downloadedBuffer.length}`);
  log(`Inhalt: "${downloadedText.trim()}"`);

  // ── 5. Aufräumen ─────────────────────────────────────────────────────────
  log('\n=== 5. Aufräumen (deleteFiles) ===');
  await client.deleteFiles([uploaded.id]);
  log(`Datei ${uploaded.id} gelöscht.`);

  saveSession(client, { companyId: COMPANY_ID });
  log('\nFertig!');
}

main()
  .catch(err => log('FEHLER:', err instanceof Error ? err.message : err))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
