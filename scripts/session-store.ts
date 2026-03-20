/**
 * Session-Persistenz für Stashcat API
 *
 * Speichert deviceId, clientKey und bekannte Metadaten (z. B. companyId)
 * in .stashcat-session.json, damit:
 *  - kein neues Gerät bei jedem Start registriert wird
 *  - bei gültigem clientKey kein Re-Login nötig ist
 *
 * Verwendung:
 *   import { getClient, saveSession } from './session-store';
 *   const { client, companyId } = await getClient();
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { StashcatClient, SerializedSession } from '../src/index';

dotenv.config();

const SESSION_FILE = path.join(__dirname, '..', '.stashcat-session.json');

/** Erweitertes Session-Objekt mit projektspezifischen Metadaten */
export interface PersistedSession extends SerializedSession {
  /** Company-ID, die einmal ermittelt und dann wiederverwendet wird */
  companyId?: string;
}

/** Lädt die gespeicherte Session (oder null wenn keine vorhanden) */
export function loadSession(): PersistedSession | null {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const raw = fs.readFileSync(SESSION_FILE, 'utf8');
      return JSON.parse(raw) as PersistedSession;
    }
  } catch {
    // Defekte Session-Datei – ignorieren, neu einloggen
  }
  return null;
}

/** Speichert die aktuelle Session inkl. optionaler Metadaten */
export function saveSession(client: StashcatClient, extra: Partial<PersistedSession> = {}): void {
  const session: PersistedSession = {
    ...client.serialize(),
    baseUrl: process.env.STASHCAT_BASE_URL,
    ...extra,
  };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2), 'utf8');
  console.log(`[session-store] Session gespeichert (deviceId=${session.deviceId.slice(0, 8)}…)`);
}

/**
 * Gibt einen authentifizierten StashcatClient zurück.
 *
 * Strategie:
 *  1. Gespeicherte Session laden → fromSession() versuchen → getMe() als Smoke-Test
 *  2. Bei Fehler (Session abgelaufen): neu einloggen, dabei dieselbe deviceId beibehalten
 *  3. Neue Session speichern
 *
 * @returns client und ggf. bekannte companyId aus der gespeicherten Session
 */
export async function getClient(): Promise<{ client: StashcatClient; companyId?: string }> {
  const saved = loadSession();

  if (saved?.clientKey) {
    try {
      const client = StashcatClient.fromSession(saved, {
        baseUrl: saved.baseUrl || process.env.STASHCAT_BASE_URL,
      });
      await client.getMe(); // Smoke-Test: schlägt fehl wenn Session abgelaufen
      console.log(`[session-store] Session wiederhergestellt (deviceId=${saved.deviceId.slice(0, 8)}…)`);
      return { client, companyId: saved.companyId };
    } catch {
      console.log('[session-store] Session abgelaufen – führe Re-Login durch…');
    }
  }

  // Neulogin – aber dieselbe deviceId wiederverwenden, damit kein neues Gerät entsteht
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: saved?.deviceId, // gleiche deviceId beibehalten
  });

  await client.login({
    email:    process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName:  process.env.STASHCAT_APP_NAME || 'stashcat-api-client',
  });

  saveSession(client, { companyId: saved?.companyId });
  return { client, companyId: saved?.companyId };
}
