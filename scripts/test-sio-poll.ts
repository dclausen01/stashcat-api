/**
 * Direkte Socket.io Polling-Anfrage zum push-Server.
 * Zeigt, was der Server im initialen Handshake zurückschickt
 * und ob er auf unsere Pakete antwortet.
 */
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getClient } from './session-store';

const OUT = path.join(__dirname, '..', 'test-sio-poll-out.txt');
const lines: string[] = [];
const log = (...a: unknown[]) => {
  const line = `[${new Date().toISOString()}] ` + a.join(' ');
  lines.push(line);
  console.log(line);
};

async function main() {
  const { client } = await getClient();
  const { clientKey, deviceId } = client.serialize();

  const base = 'https://push.stashcat.com/socket.io/';
  const params = (extra: Record<string, string> = {}) =>
    new URLSearchParams({ EIO: '4', transport: 'polling', client_key: clientKey, device_id: deviceId, ...extra }).toString();

  log('=== Socket.io Polling Handshake Test ===');

  // 1. GET handshake — server returns: 0{"sid":"...","upgrades":["websocket"],...}
  log('Step 1: GET handshake...');
  const r1 = await axios.get(`${base}?${params()}`, { validateStatus: () => true });
  log(`  Status: ${r1.status}`);
  log(`  Headers: ${JSON.stringify(r1.headers)}`);
  const body1 = String(r1.data);
  log(`  Body (raw): ${body1.slice(0, 500)}`);

  // Parse the SID from the handshake response
  // EIO4 format: <packet_length>\0<packet_type><json>
  // Example: "0{"sid":"abc123","upgrades":["websocket"],...}"
  const sidMatch = body1.match(/"sid":"([^"]+)"/);
  const sid = sidMatch ? sidMatch[1] : null;
  log(`  Parsed SID: ${sid}`);

  if (!sid) {
    log('ERROR: Could not get SID — aborting');
    return;
  }

  // 2. POST the Socket.io namespace connect packet: "40" (connect to "/" namespace)
  log('Step 2: POST namespace connect (packet "40")...');
  const r2 = await axios.post(
    `${base}?${params({ sid })}`,
    '40',  // Socket.io connect packet
    { headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, validateStatus: () => true }
  );
  log(`  Status: ${r2.status}, Body: ${String(r2.data).slice(0, 200)}`);

  // 3. GET — check if server sent any events
  log('Step 3: GET — poll for server events...');
  const r3 = await axios.get(`${base}?${params({ sid })}`, { validateStatus: () => true });
  log(`  Status: ${r3.status}`);
  log(`  Body: ${String(r3.data).slice(0, 500)}`);

  // 4. POST the preauth event: 42["preauth",{"client_key":"...","device_id":"..."}]
  log('Step 4: POST emit("preauth", {...})...');
  const preauthPayload = `42["preauth",{"client_key":"${clientKey}","device_id":"${deviceId}"}]`;
  const r4 = await axios.post(
    `${base}?${params({ sid })}`,
    preauthPayload,
    { headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, validateStatus: () => true }
  );
  log(`  Status: ${r4.status}, Body: ${String(r4.data).slice(0, 200)}`);

  // 5. GET — check for server response to preauth
  await new Promise(r => setTimeout(r, 1000));
  log('Step 5: GET — poll for preauth response...');
  const r5 = await axios.get(`${base}?${params({ sid })}`, { validateStatus: () => true });
  log(`  Status: ${r5.status}`);
  log(`  Body: ${String(r5.data).slice(0, 500)}`);

  // 6. POST subscribe: 42["subscribe",{"type":"channel","id":"3279211"}]
  log('Step 6: POST emit("subscribe", {type: "channel", id: "3279211"})...');
  const subPayload = `42["subscribe",{"type":"channel","id":"3279211"}]`;
  const r6 = await axios.post(
    `${base}?${params({ sid })}`,
    subPayload,
    { headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, validateStatus: () => true }
  );
  log(`  Status: ${r6.status}, Body: ${String(r6.data).slice(0, 200)}`);

  // 7. GET — final poll
  await new Promise(r => setTimeout(r, 2000));
  log('Step 7: GET — final poll...');
  const r7 = await axios.get(`${base}?${params({ sid })}`, { validateStatus: () => true });
  log(`  Status: ${r7.status}`);
  log(`  Body: ${String(r7.data).slice(0, 500)}`);

  log('=== Done ===');
}

main()
  .catch(err => log('FATAL:', String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
