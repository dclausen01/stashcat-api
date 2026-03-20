import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { StashcatAPI } from '../src/api/request';
import { AuthManager } from '../src/auth/login';
import { UserManager } from '../src/users/users';

dotenv.config();

const OUT = 'scripts/run-stdout.txt';
const log = (msg: string) => fs.appendFileSync(OUT, msg + '\n');

async function main() {
  fs.writeFileSync(OUT, '');

  const api = new StashcatAPI({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });
  const auth = new AuthManager(api);
  const users = new UserManager(api);

  await auth.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-test',
  });
  log('Login OK');

  const me = await users.getMe();
  log(`User-ID: ${me.id}`);

  // Persönliche Dateien – rohe Payload loggen
  const dataPersonal = api.createAuthenticatedRequestData({
    folder_id: '0',
    type: 'personal',
    type_id: me.id,
    folder_only: false,
    offset: 0,
    limit: 50,
    sorting: 'name',
  });
  const rawPersonal = await api.post<unknown>('/folder/get', dataPersonal);
  log('\n=== Rohe Payload (personal) ===');
  log(JSON.stringify(rawPersonal, null, 2).slice(0, 2000));

  // Channel-Dateien
  const dataChannel = api.createAuthenticatedRequestData({
    folder_id: '0',
    type: 'channel',
    type_id: '3279211',
    folder_only: false,
    offset: 0,
    limit: 50,
    sorting: 'name',
  });
  const rawChannel = await api.post<unknown>('/folder/get', dataChannel);
  log('\n=== Rohe Payload (channel 3279211) ===');
  log(JSON.stringify(rawChannel, null, 2).slice(0, 2000));
}

main().catch(e => {
  fs.appendFileSync(OUT, `\nFehler: ${e}\n`);
  process.exit(1);
});
