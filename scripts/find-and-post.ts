/**
 * Findet den Kanal "Notizen_ClauD" und postet eine Testnachricht.
 *
 * Nutzt Session-Persistenz: beim ersten Lauf wird eingeloggt und die Session
 * gespeichert. Nachfolgende Läufe verwenden die gespeicherte Session und
 * dieselbe deviceId, sodass kein neues Gerät registriert wird.
 */

import { getClient, saveSession } from './session-store';

const COMPANY_ID = '68956';
const TARGET_CHANNEL = 'Notizen_ClauD';

async function main() {
  const { client, companyId } = await getClient();

  const effectiveCompanyId = companyId || COMPANY_ID;

  console.log(`\nLade Channels für Company ${effectiveCompanyId}…`);
  const channels = await client.getChannels(effectiveCompanyId);
  console.log(`${channels.length} Channels gefunden.`);

  const target = channels.find(ch => ch.name === TARGET_CHANNEL);
  if (!target) {
    console.error(`Kanal "${TARGET_CHANNEL}" nicht gefunden.`);
    process.exit(1);
  }

  console.log(`\nPoste in "${target.name}" (id=${target.id})…`);
  const msg = await client.sendMessage({
    target:      target.id,
    target_type: 'channel',
    text:        'Automatischer Test',
  });
  console.log(`Nachricht gesendet! id=${msg.id}, text="${msg.text}"`);

  // companyId für zukünftige Läufe persistieren
  saveSession(client, { companyId: effectiveCompanyId });
}

main().catch(err => {
  console.error('Fehler:', err instanceof Error ? err.message : err);
  process.exit(1);
});
