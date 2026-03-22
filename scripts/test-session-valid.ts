/**
 * Verifiziert ob die gespeicherte Session noch aktiv ist
 * und holt die aktuelle User-ID und alle Channel-IDs.
 * Dann verbindet direkt per Socket.io mit diesen IDs.
 */
import * as fs from 'fs';
import * as path from 'path';
import { io } from 'socket.io-client';
import { getClient } from './session-store';

const OUT = path.join(__dirname, '..', 'test-session-valid-out.txt');
const lines: string[] = [];
const log = (...a: unknown[]) => {
  const line = `[${new Date().toISOString()}] ` + a.join(' ');
  lines.push(line);
  console.log(line);
};

async function main() {
  const { client } = await getClient();
  const session = client.serialize();

  log('=== Session Validity + Realtime Test ===');

  // 1. Verify session via API call
  log('Prüfe Session via /users/me...');
  try {
    const me = await client.getMe();
    log(`✅ Session gültig! User: ${me.first_name} ${me.last_name} (ID: ${me.id})`);

    // 2. Get channels for company
    log('Lade Channels...');
    const channels = await client.getChannels('68956');
    const channelIds = channels.map(c => c.id);
    log(`Gefundene Channels: ${channels.length}`);
    channels.forEach(c => log(`  - [${c.id}] ${c.name}`));

    // 3. Connect to push server with subscription to ALL user channels
    log('\nVerbinde mit push.stashcat.com...');
    const socket = io('https://push.stashcat.com', {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
      query: {
        client_key: session.clientKey,
        device_id: session.deviceId,
      },
    });

    socket.onAny((event, ...args) => {
      const safe = JSON.stringify(args, (k, v) => {
        if (typeof v === 'string' && v.length > 30 && (k === 'key' || k.includes('key') || k.includes('token'))) return '[redacted]';
        return v;
      }).slice(0, 400);
      log(`📡 Event: "${event}"`, safe);
    });

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        log(`✅ Verbunden! id=${socket.id}`);

        // Subscribe to ALL channels
        for (const ch of channels) {
          socket.emit('subscribe', { type: 'channel', id: ch.id });
          socket.emit('subscribe', { type: 'channel', id: String(ch.id) });
        }
        // Also try subscribing with user ID
        socket.emit('subscribe', { type: 'user', id: me.id });
        socket.emit('subscribe', { type: 'user', id: String(me.id) });
        // Try with company
        socket.emit('subscribe', { type: 'company', id: '68956' });

        log(`→ Subscribed to ${channels.length} channels + user + company`);
        log(`→ Sende jetzt eine Nachricht in schul.cloud!`);
      });

      socket.on('connect_error', (err) => {
        log(`❌ connect_error: ${err.message}`);
        resolve();
      });

      // Wait 60 seconds
      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, 60_000);
    });

    log(`Gesamt Events: ${lines.filter(l => l.includes('📡')).length}`);

  } catch (err) {
    log(`❌ Fehler: ${String(err)}`);
  }
}

main()
  .catch(err => log('FATAL:', String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
