/**
 * Testet RealtimeManager mit der KORREKTEN Auth-Sequenz:
 *
 *   1. Verbinde zu push.stashcat.com (kein client_key in den Options!)
 *   2. Nach connect: emit "userid" { hidden_id: userInfo.socket_id, device_id, client_key }
 *   3. Lausche 45s auf alle Events via onAny
 *
 * Quelle: Reverse-Engineering von chunk-6A7IIHB3.js (schul.cloud Angular-Bundle)
 *   onConnect() → socket.emit(Qa.UserId, { hidden_id: userInfo.socketId, device_id, client_key })
 *   socketId kommt aus API-Feld socket_id in /users/me
 */

import * as fs from 'fs';
import * as path from 'path';
import { io } from 'socket.io-client';
import { getClient } from './session-store';

const OUT = path.join(__dirname, '..', 'test-realtime-out.txt');
const DURATION_MS = 45_000;

const lines: string[] = [];
const log = (...args: unknown[]) => {
  const line = `[${new Date().toISOString()}] ` + args.map(a =>
    typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)
  ).join(' ');
  lines.push(line);
  console.log(line);
};

async function main() {
  const { client } = await getClient();
  const session = client.serialize();
  const ck  = session.clientKey;
  const did = session.deviceId;

  // socket_id (= hidden_id) aus /users/me holen
  log('=== Hole socket_id aus /users/me ===');
  const me = await client.getMe();
  log('getMe():', JSON.stringify(me));

  const socketId = (me as unknown as Record<string, unknown>).socket_id as string | undefined;
  if (!socketId) {
    log('⚠️  WARNUNG: socket_id ist leer! Auth-Emit wird trotzdem versucht...');
  }
  log(`socket_id = ${socketId ?? '(nicht vorhanden)'}`);

  log('\n=== Verbinde zu push.stashcat.com ===');
  log(`client_key = ${ck.slice(0, 8)}... | device_id = ${did}`);
  log(`Dauer: ${DURATION_MS / 1000}s`);

  await new Promise<void>((resolve) => {
    const socket = io('https://push.stashcat.com', {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10_000,
      // withCredentials: true  ← Browser-Only; in Node.js nicht nötig
    });

    const timer = setTimeout(() => {
      log('\n⏱  Timeout — trenne Verbindung');
      socket.disconnect();
      resolve();
    }, DURATION_MS);

    // Auth nach Connect — die einzige korrekte Methode laut Bundle-Analyse
    socket.on('connect', () => {
      log(`✅ Verbunden! socket.id = ${socket.id}`);
      const authPayload = {
        hidden_id: socketId ?? '',
        device_id: did,
        client_key: ck,
      };
      log('→ Sende "userid":', JSON.stringify(authPayload));
      socket.emit('userid', authPayload);
    });

    // Alle Events loggen
    socket.onAny((event: string, ...args: unknown[]) => {
      const safeArgs = JSON.stringify(args, (_k, v) =>
        typeof v === 'string' && v.length > 80 ? v.slice(0, 30) + '…' : v
      ).slice(0, 500);
      log(`📡 Event: "${event}"`, safeArgs);
    });

    socket.on('connect_error', (err: Error) => {
      log(`❌ connect_error: ${err.message}`);
      clearTimeout(timer);
      socket.disconnect();
      resolve();
    });

    socket.on('disconnect', (reason: string) => {
      log(`⚠️  disconnect: ${reason}`);
    });
  });

  log('\n=== Test beendet ===');
  const eventCount = lines.filter(l => l.includes('📡')).length;
  log(`Empfangene Events: ${eventCount}`);
}

main()
  .catch(err => lines.push('FATAL: ' + String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
