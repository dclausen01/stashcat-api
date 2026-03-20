/**
 * Testet verschiedene Serialisierungsformate für den files-Parameter in /message/send.
 * Bekannte hochgeladene File-ID: 622405431 (test-upload-tmp.txt im Kanal Notizen_ClauD)
 */

import axios from 'axios';
import { getClient } from './session-store';

const CHANNEL_ID = '3279211'; // Notizen_ClauD
const FILE_ID = '622405431';

async function main() {
  const { client } = await getClient();
  const session = client.serialize();
  const baseUrl = (process.env.STASHCAT_BASE_URL || 'https://api.schul.cloud/').replace(/\/$/, '');
  const url = `${baseUrl}/message/send`;

  const base = {
    client_key: session.clientKey,
    device_id: session.deviceId,
    target: 'channel',
    channel_id: CHANNEL_ID,
    text: 'Test Dateianhang-Format',
  };

  async function tryFormat(label: string, filesField: Record<string, unknown>) {
    process.stdout.write(`  ${label} … `);
    try {
      const res = await axios.post(url, { ...base, ...filesField }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        timeout: 15000,
      });
      const status = res.data?.status?.value;
      const msgId = res.data?.payload?.message?.id;
      console.log(`✓  status=${status}, msg.id=${msgId}`);
      return msgId;
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.status?.message || err.message;
      console.log(`✗  HTTP ${status}: ${msg}`);
      return null;
    }
  }

  console.log(`\nTeste files-Serialisierung für Datei ${FILE_ID} in Kanal ${CHANNEL_ID}:\n`);

  // Format 1: JSON-kodierter String  files=["622405431"]
  await tryFormat('files=JSON-String  ["id"]', { files: JSON.stringify([FILE_ID]) });

  // Format 2: Einzel-Wert  files=622405431
  await tryFormat('files=einzel string', { files: FILE_ID });

  // Format 3: Axios-Array-Notation (Standard)  files[0]=622405431
  await tryFormat('files=[id] (Axios-Array)', { files: [FILE_ID] });

  // Format 4: Kommasepariert  files=622405431
  await tryFormat('files=kommasepariert', { files: FILE_ID });

  // Format 5: Kein files, nur file_ids
  await tryFormat('file_ids=JSON-String', { file_ids: JSON.stringify([FILE_ID]) });
}

main().catch(err => {
  console.error('Fehler:', err instanceof Error ? err.message : err);
  process.exit(1);
});
