/**
 * Test: get group members and group invite
 */
import 'dotenv/config';
import { StashcatClient } from '../src/index';

async function main() {
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
  });

  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
    appName: process.env.STASHCAT_APP_NAME || 'stashcat-api-test',
    deviceId: process.env.STASHCAT_DEVICE_ID,
  });

  const api = (client as any).api;

  // Test getting group members via /manage/list_users with group filter
  console.log('=== Testing /manage/list_users with group filter ===');
  // AAD-Verwaltung has 32 members (group_id=277991)
  const testParams = [
    { company_id: '68956', group_id: '277991', limit: 5 },
    { company_id: '68956', group: '277991', limit: 5 },
    { company_id: '68956', contact_group_id: '277991', limit: 5 },
    { company_id: '68956', role_id: '277991', limit: 5 },
    { company_id: '68956', filter_group: '277991', limit: 5 },
    { company_id: '68956', groups: '277991', limit: 5 },
    { company_id: '68956', group_ids: JSON.stringify(['277991']), limit: 5 },
  ];

  for (const params of testParams) {
    const paramDesc = Object.entries(params).filter(([k]) => !['company_id', 'limit'].includes(k)).map(([k, v]) => `${k}=${v}`).join(', ');
    try {
      const data = api.createAuthenticatedRequestData(params);
      const raw = await api.post('/manage/list_users', data);
      const total = raw.num_total_records;
      console.log(`  ${paramDesc} → total=${total}, returned=${raw.users?.length}`);
      if (total < 4841) {
        console.log(`    >>> FILTER WORKS! Only ${total} users (not all 4841)`);
        if (raw.users?.length > 0) {
          console.log(`    First: ${raw.users[0].first_name} ${raw.users[0].last_name}`);
        }
      }
    } catch (err: any) {
      console.log(`  ${paramDesc} → ERROR: ${err.message?.slice(0, 80)}`);
    }
  }

  // Also test: /manage/list_group_users and similar
  console.log('\n=== Testing group-specific user list endpoints ===');
  const groupEndpoints = [
    '/manage/group_members',
    '/manage/list_group_users',
    '/manage/group',
    '/company/group_members',
    '/company/contact_group_members',
  ];

  for (const path of groupEndpoints) {
    try {
      const data = api.createAuthenticatedRequestData({ company_id: '68956', group_id: '277991' });
      const raw = await api.post(path, data);
      console.log(`  ${path} → Keys: ${Object.keys(raw).join(', ')}`);
      for (const [k, v] of Object.entries(raw)) {
        if (Array.isArray(v)) console.log(`    ${k}: Array[${(v as unknown[]).length}]`);
        else console.log(`    ${k}: ${typeof v}`);
      }
    } catch (err: any) {
      console.log(`  ${path} → ERROR: ${err.message?.slice(0, 60)}`);
    }
  }

  await client.logout();
}

main().catch(console.error);
