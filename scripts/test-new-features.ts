/**
 * Testet die neuen Features:
 *  1. getCompanies() — Company-Discovery
 *  2. Online-Status via Realtime
 *  3. sendTyping() via Realtime
 */
import * as fs from 'fs';
import * as path from 'path';
import { getClient } from './session-store';

const OUT = path.join(__dirname, '..', 'test-new-features-out.txt');
const lines: string[] = [];
const log = (...args: unknown[]) => {
  const line = `[${new Date().toISOString()}] ` + args.map(a =>
    typeof a === 'object' ? JSON.stringify(a, null, 0) : String(a)
  ).join(' ');
  lines.push(line);
};

async function main() {
  const { client } = await getClient();

  // ── 1. getCompanies() ──────────────────────────────────────
  log('=== Test: getCompanies() ===');
  try {
    const companies = await client.getCompanies();
    log('Erfolg! Companies:', JSON.stringify(companies));
  } catch (error) {
    log('Fehler bei getCompanies():', error instanceof Error ? error.message : String(error));
    // Fallback: company_id aus den Rollen extrahieren
    log('Fallback: extrahiere company_id aus getMe().roles...');
    try {
      const me = await client.getMe();
      const meAny = me as unknown as Record<string, unknown>;
      const roles = meAny.roles as Array<{ company_id: string; name: string }> | undefined;
      if (roles) {
        const companyIds = [...new Set(roles.map(r => r.company_id))];
        log('Company IDs aus Rollen:', companyIds);
      }
    } catch (e) {
      log('Auch Fallback fehlgeschlagen:', e instanceof Error ? e.message : String(e));
    }
  }

  // ── 2. Realtime: Online-Status + Typing ─────────────────────
  log('\n=== Test: RealtimeManager (Online-Status + Typing) ===');
  try {
    const rt = await client.createRealtimeManager({ debug: false });
    log('RealtimeManager erstellt, verbinde...');
    await rt.connect();
    log('Verbunden!');

    // Warte auf Events (30s)
    const events: string[] = [];
    const onAnyHandler = (event: string, ...args: unknown[]) => {
      const safe = JSON.stringify(args).slice(0, 300);
      log(`📡 Event: "${event}" ${safe}`);
      events.push(event);
    };

    // Registriere onAny via Socket-Zugriff ist nicht möglich - nutze on() für bekannte Events
    rt.on('new_device_connected', (data: unknown) => log('📡 new_device_connected:', JSON.stringify(data)));
    rt.on('online_status_change', (data: unknown) => log('📡 online_status_change:', JSON.stringify(data)));
    rt.on('message_sync', (data: unknown) => {
      const msg = data as Record<string, unknown>;
      log('📡 message_sync: channel_id=' + msg.channel_id + ' text=' + String(msg.text).slice(0, 30));
    });
    rt.on('user-started-typing', (...args: unknown[]) => log('📡 user-started-typing:', JSON.stringify(args)));
    rt.on('channel_modified', (data: unknown) => log('📡 channel_modified:', JSON.stringify(data)));
    rt.on('object_change', (data: unknown) => log('📡 object_change:', JSON.stringify(data)));
    rt.on('notification', (data: unknown) => log('📡 notification:', JSON.stringify(data)));
    rt.on('message_read', (data: unknown) => log('📡 message_read:', JSON.stringify(data)));

    // ── sendTyping Test ──
    const CHANNEL_ID = '3279211'; // Notizen_ClauD
    log('→ Sende Typing-Indikator an Channel ' + CHANNEL_ID);
    rt.sendTyping('channel', CHANNEL_ID);

    // Warte 30 Sekunden
    log('Lausche 30 Sekunden auf Events...');
    await new Promise(resolve => setTimeout(resolve, 30_000));

    const discovered = rt.getDiscoveredEvents();
    log('\nEntdeckte Events: ' + JSON.stringify(discovered));
    log('Events insgesamt: ' + discovered.length);

    rt.disconnect();
    log('Verbindung getrennt.');
  } catch (error) {
    log('RealtimeManager Fehler:', error instanceof Error ? error.message : String(error));
  }

  log('\n=== Tests beendet ===');
}

main()
  .catch(err => lines.push('FATAL: ' + String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
