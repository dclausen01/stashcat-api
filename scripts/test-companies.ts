import * as fs from 'fs';
import * as path from 'path';
import { getClient } from './session-store';

const OUT = path.join(__dirname, '..', 'test-companies-out.txt');
const lines: string[] = [];
const log = (...args: unknown[]) => {
  lines.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
};

async function main() {
  const { client } = await getClient();

  log('=== getCompanies() via /company/member ===');
  const companies = await client.getCompanies();
  log('Anzahl:', companies.length);
  for (const c of companies) {
    log('  id:', c.id, '| name:', c.name, '| users:', c.users, '| features:', JSON.stringify(c.features));
  }

  if (companies.length > 0) {
    log('\n=== getCompanyDetails(' + companies[0].id + ') ===');
    const detail = await client.getCompanyDetails(companies[0].id);
    log('  name:', detail.name);
    log('  quota:', detail.quota, '| users:', detail.users, '| max_users:', detail.max_users);
    log('  features:', JSON.stringify(detail.features));
    log('  marketplace_modules:', JSON.stringify(detail.marketplace_modules));
    log('  domains:', JSON.stringify(detail.domains));
  }
}

main()
  .catch(err => lines.push('FATAL: ' + String(err)))
  .finally(() => fs.writeFileSync(OUT, lines.join('\n')));
