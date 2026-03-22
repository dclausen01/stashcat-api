/**
 * Prüft, ob die API beim Login Set-Cookie-Header setzt,
 * und ob diese für push.stashcat.com relevant sind.
 */
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const OUT = path.join(__dirname, '..', 'test-cookies-out.txt');
const lines: string[] = [];
const log = (...a: unknown[]) => {
  const line = `[${new Date().toISOString()}] ` + a.join(' ');
  lines.push(line);
  console.log(line);
};

async function main() {
  const baseUrl = process.env.STASHCAT_BASE_URL || 'https://api.stashcat.com/';
  const email = process.env.STASHCAT_EMAIL!;
  const password = process.env.STASHCAT_PASSWORD!;

  log('=== Cookie Test ===');

  // Login und Response-Headers inspizieren
  const client = axios.create({
    baseURL: baseUrl,
    maxRedirects: 0,
    validateStatus: () => true,
    withCredentials: true,
  });

  log('POST /auth/login...');
  const params = new URLSearchParams({
    email,
    password,
    device_id: 'test_cookie_check_device',
    app_name: 'stashcat-api-client',
    encrypted: 'false',
    callable: 'false',
    key_transfer_support: 'false',
  });

  const resp = await client.post('/auth/login', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  log(`Status: ${resp.status}`);
  log('Response Headers:');
  for (const [k, v] of Object.entries(resp.headers)) {
    // Nur nicht-sensitive Header loggen
    if (['set-cookie', 'content-type', 'server', 'x-powered-by', 'access-control-allow-credentials', 'access-control-allow-origin', 'vary'].includes(k.toLowerCase())) {
      // Mask cookie values
      const val = k.toLowerCase() === 'set-cookie'
        ? (Array.isArray(v) ? v.map(c => c.split('=')[0] + '=[VALUE]' + c.split(';').slice(1).join(';')) : String(v).split('=')[0] + '=[VALUE]')
        : v;
      log(`  ${k}: ${JSON.stringify(val)}`);
    }
  }

  const payload = resp.data?.payload;
  log(`Payload keys: ${payload ? Object.keys(payload).join(', ') : 'none'}`);

  // Prüfe ob 'token' oder 'session' oder andere Auth-Felder im Payload sind
  if (payload) {
    const sensitiveKeys = ['client_key', 'token', 'session', 'auth_token', 'access_token'];
    const foundKeys = sensitiveKeys.filter(k => payload[k] !== undefined);
    log(`Auth-relevante Felder: ${foundKeys.join(', ') || 'keine gefunden'}`);
    log(`Alle Payload-Felder: ${Object.keys(payload).join(', ')}`);
  }
}

main()
  .catch(err => log('FATAL:', String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
