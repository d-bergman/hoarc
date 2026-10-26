import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

test('RTDB rules isolate public projection, private drafts, audit, and rate limits', { skip: !process.env.FIREBASE_DATABASE_EMULATOR_HOST }, async () => {
  const { initializeTestEnvironment, assertSucceeds, assertFails } = await import('@firebase/rules-unit-testing');
  const { ref, get, set } = await import('firebase/database');
  const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
  const env = await initializeTestEnvironment({ projectId: 'demo-hoarc', database: { host, port: Number(port), rules: await readFile('database.rules.json', 'utf8') } });
  try {
    await env.withSecurityRulesDisabled(async context => {
      await set(ref(context.database(), 'announcementState'), { records: { draft: { title: 'Private' } }, audit: { a: { by: 'private-admin' } }, published: { public: { title: 'Service update' } } });
      await set(ref(context.database(), 'contactRateLimits/a'), { count: 1, expiresAt: 1000 });
    });
    const visitor = env.unauthenticatedContext().database();
    const member = env.authenticatedContext('member').database();
    const admin = env.authenticatedContext('admin', { admin: true }).database();
    await assertSucceeds(get(ref(visitor, 'announcementState/published')));
    for (const path of ['/', 'announcementState', 'announcementState/records', 'announcementState/audit', 'contactRateLimits']) await assertFails(get(ref(visitor, path)));
    await assertFails(get(ref(member, 'announcementState/records')));
    await assertSucceeds(get(ref(admin, 'announcementState/records')));
    await assertSucceeds(get(ref(admin, 'announcementState/audit')));
    for (const db of [visitor, member, admin]) for (const path of ['announcementState/records/x', 'announcementState/published/x', 'announcementState/audit/x', 'contactRateLimits/x']) await assertFails(set(ref(db, path), { title: 'Client write' }));
  } finally { await env.cleanup(); }
});
