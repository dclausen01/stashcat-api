/**
 * Quick test: what does /company/member actually return with company_id?
 */
import 'dotenv/config';
import { StashcatClient } from '../src';

async function main() {
  const client = new StashcatClient({
    baseUrl: process.env.STASHCAT_BASE_URL,
  });

  await client.login({
    email: process.env.STASHCAT_EMAIL!,
    password: process.env.STASHCAT_PASSWORD!,
  });

  console.log('Logged in');

  // Get companies first
  const companies = await client.getCompanies();
  const companyId = companies[0]?.id;
  console.log(`Company: ${companies[0]?.name} (id=${companyId})`);

  // Now call getCompanyMembers and see what we get
  console.log('\n--- Without limit/offset ---');
  const members1 = await client.getCompanyMembers(companyId);
  console.log(`Result: ${members1.length} members`);
  if (members1.length > 0) {
    console.log('First member:', JSON.stringify(members1[0], null, 2));
  }

  // With limit
  console.log('\n--- With limit=10, offset=0 ---');
  const members2 = await client.getCompanyMembers(companyId, { limit: 10, offset: 0 });
  console.log(`Result: ${members2.length} members`);
  if (members2.length > 0) {
    console.log('First member:', JSON.stringify(members2[0], null, 2));
  }

  // Try raw API call to see full payload
  console.log('\n--- Raw API call to see full payload ---');
  const api = (client as unknown as { api: { post: (path: string, data: unknown) => Promise<unknown>; createAuthenticatedRequestData: (data: object) => Record<string, unknown> } }).api;
  const data = api.createAuthenticatedRequestData({ company_id: companyId });
  try {
    const raw = await api.post('/company/member', data);
    const keys = Object.keys(raw as object);
    console.log('Payload keys:', keys);
    for (const key of keys) {
      const val = (raw as Record<string, unknown>)[key];
      if (Array.isArray(val)) {
        console.log(`  ${key}: Array[${val.length}]`);
        if (val.length > 0) console.log(`    first:`, JSON.stringify(val[0]).substring(0, 200));
      } else if (typeof val === 'object' && val !== null) {
        console.log(`  ${key}: Object with keys:`, Object.keys(val));
      } else {
        console.log(`  ${key}:`, val);
      }
    }
  } catch (err) {
    console.error('Raw call failed:', err);
  }

  await client.logout();
}

main().catch(console.error);
