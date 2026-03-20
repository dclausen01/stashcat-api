/**
 * Test: Login mit encrypted=true + verschiedene /folder/get Varianten
 */
import axios from 'axios';
import * as dotenv from 'dotenv';
import { loadSession } from './session-store';
import { StashcatClient } from '../src/index';

dotenv.config();

async function main() {
  const saved = loadSession();
  const baseUrl = (process.env.STASHCAT_BASE_URL || 'https://api.schul.cloud/').replace(/\/$/, '');

  // Login MIT encrypted=true
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
    deviceId: saved?.deviceId,
  });
  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: 'stashcat-api-client',
    encrypted: true,
    callable: true,
    keyTransferSupport: true,
  });
  const session = client.serialize();
  process.stdout.write(`Login mit encrypted=true. clientKey=${session.clientKey.slice(0, 8)}...\n`);

  // Schauen wie der Login-Response aussieht (raw)
  const loginBody = new URLSearchParams({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    device_id: session.deviceId,
    app_name: 'stashcat-api-client',
    encrypted: 'true',
    callable: 'true',
    key_transfer_support: 'true',
  });
  const loginRes = await axios.post(`${baseUrl}/auth/login`, loginBody.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
  });
  process.stdout.write(`Login payload keys: ${Object.keys(loginRes.data?.payload || {}).join(', ')}\n`);
  process.stdout.write(`Login payload: ${JSON.stringify(loginRes.data?.payload, null, 2).slice(0, 800)}\n`);

  const freshKey = loginRes.data?.payload?.client_key || session.clientKey;

  async function post(label: string, endpoint: string, params: Record<string, string>) {
    const body = new URLSearchParams({ client_key: freshKey, device_id: session.deviceId, ...params });
    process.stdout.write(`\n--- ${label} ---\n`);
    try {
      const res = await axios.post(`${baseUrl}${endpoint}`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        timeout: 8000,
      });
      const st = res.data?.status;
      process.stdout.write(`  ${st?.value} - ${st?.message}\n  ${JSON.stringify(res.data?.payload)}\n`);
    } catch (e: any) {
      process.stdout.write(`  Fehler: ${e.response?.status} ${e.message}\n`);
    }
  }

  await post('folder/get type=channel', '/folder/get', { type: 'channel', type_id: '3279211' });
  await post('folder/get type=user+me', '/folder/get', { type: 'user', type_id: '7369251' });
  await post('folder/get nur client_key', '/folder/get', {});
}

main().catch(e => process.stderr.write(`FATAL: ${e.message}\n`));
