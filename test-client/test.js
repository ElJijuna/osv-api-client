// Manual integration test — run with: npm run test:client
// Requires: npm run build first
import { OsvClient } from '../dist/index.js';

const osv = new OsvClient();

osv.on('request', (event) => {
  const status = event.error ? `ERROR ${event.error.message}` : event.statusCode;
  console.log(`  ${event.method} ${event.url} → ${status} (${event.durationMs}ms)`);
});

async function run() {
  console.log('\n--- vuln() ---');
  const vuln = await osv.vuln('GHSA-wjp5-868j-wqv7');
  console.log(`ID: ${vuln.id}`);
  console.log(`Summary: ${vuln.summary}`);
  console.log(`Published: ${vuln.published}`);
  console.log(`Affected packages: ${vuln.affected?.map(a => a.package?.name ?? '(unknown)').join(', ')}`);

  console.log('\n--- query() ---');
  const result = await osv.query({
    package: { name: 'lodash', ecosystem: 'npm' },
    version: '4.17.20',
  });
  console.log(`Vulnerabilities found: ${result.vulns?.length ?? 0}`);
  result.vulns?.forEach(v => console.log(`  - ${v.id}: ${v.summary}`));

  console.log('\n--- queryBatch() ---');
  const batch = await osv.queryBatch([
    { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.20' },
    { package: { name: 'express', ecosystem: 'npm' }, version: '4.17.1' },
    { package: { name: 'react', ecosystem: 'npm' }, version: '18.2.0' },
  ]);
  batch.results.forEach((r, i) => {
    console.log(`  Query ${i}: ${r.vulns?.length ?? 0} vulnerabilities`);
  });

  console.log('\nAll tests passed.');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
