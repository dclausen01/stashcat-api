/**
 * Test /manage/list_users search + /manage/list_groups details
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

  console.log('Logged in successfully');
  const api = (client as any).api;

  // Test 1: /manage/list_users with search
  console.log('\n=== /manage/list_users with search ===');
  const data1 = api.createAuthenticatedRequestData({ company_id: '68956', search: 'Tumm', limit: 10 });
  const res1 = await api.post('/manage/list_users', data1);
  console.log(`Total: ${res1.num_total_records}, returned: ${res1.users.length}`);
  for (const u of res1.users) {
    console.log(`  ${u.id}: ${u.first_name} ${u.last_name} <${u.email}>`);
  }

  // Test 2: /manage/list_users with offset pagination
  console.log('\n=== /manage/list_users pagination (offset=0, limit=5) ===');
  const data2 = api.createAuthenticatedRequestData({ company_id: '68956', limit: 5, offset: 0 });
  const res2 = await api.post('/manage/list_users', data2);
  console.log(`Total: ${res2.num_total_records}, returned: ${res2.users.length}`);
  for (const u of res2.users) {
    console.log(`  ${u.id}: ${u.first_name} ${u.last_name}`);
  }

  console.log('\n=== /manage/list_users pagination (offset=5, limit=5) ===');
  const data3 = api.createAuthenticatedRequestData({ company_id: '68956', limit: 5, offset: 5 });
  const res3 = await api.post('/manage/list_users', data3);
  console.log(`Total: ${res3.num_total_records}, returned: ${res3.users.length}`);
  for (const u of res3.users) {
    console.log(`  ${u.id}: ${u.first_name} ${u.last_name}`);
  }

  // Test 3: /manage/list_groups - first 5 groups
  console.log('\n=== /manage/list_groups (first 5) ===');
  const data4 = api.createAuthenticatedRequestData({ company_id: '68956' });
  const res4 = await api.post('/manage/list_groups', data4);
  console.log(`Total groups: ${res4.groups.length}`);
  for (const g of res4.groups.slice(0, 5)) {
    console.log(`  Group ${g.id}: "${g.name}" (count=${g.count}, ldap=${g.ldap_group})`);
    console.log(`    Keys: ${Object.keys(g).join(', ')}`);
  }

  // Test 4: Check if there's a /manage/list_group_members or /manage/group_users endpoint
  console.log('\n=== Testing group member endpoints ===');
  const firstGroupId = res4.groups[0].id;
  console.log(`Using group: ${res4.groups[0].name} (id=${firstGroupId})`);

  const groupEndpoints = [
    { path: '/manage/list_group_members', params: { company_id: '68956', group_id: firstGroupId } },
    { path: '/manage/group_members', params: { company_id: '68956', group_id: firstGroupId } },
    { path: '/manage/group_users', params: { company_id: '68956', group_id: firstGroupId } },
    { path: '/manage/list_users', params: { company_id: '68956', group_id: firstGroupId } },
  ];

  for (const ep of groupEndpoints) {
    console.log(`\n  --- ${ep.path} ---`);
    try {
      const data = api.createAuthenticatedRequestData(ep.params);
      const raw = await api.post(ep.path, data);
      console.log(`  Keys: ${Object.keys(raw).join(', ')}`);
      for (const [key, val] of Object.entries(raw)) {
        if (Array.isArray(val)) {
          console.log(`    ${key}: Array[${(val as unknown[]).length}]`);
          if ((val as unknown[]).length > 0) {
            const first = val[0] as Record<string, unknown>;
            console.log(`    First: ${first.first_name ?? first.name} ${first.last_name ?? ''}`);
          }
        } else {
          console.log(`    ${key}: ${JSON.stringify(val).slice(0, 80)}`);
        }
      }
    } catch (err: any) {
      console.log(`  ERROR: ${err.message?.slice(0, 80)}`);
    }
  }

  await client.logout();
  console.log('\nDone');
}

main().catch(console.error);
