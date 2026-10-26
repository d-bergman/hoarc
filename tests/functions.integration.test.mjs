import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

test('emulated functions enforce admin claims, revisions, publication, and safe contact fallback', { skip: !process.env.FIREBASE_AUTH_EMULATOR_HOST, timeout: 60000 }, async () => {
  const require = createRequire(new URL('../functions/package.json', import.meta.url));
  const { initializeApp, deleteApp } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const { getDatabase } = require('firebase-admin/database');
  const app = initializeApp({ projectId: 'demo-hoarc', databaseURL: 'https://demo-hoarc-default-rtdb.firebaseio.com' }, 'integration');
  const auth = getAuth(app); const db = getDatabase(app);
  const base = 'http://127.0.0.1:5001/demo-hoarc/us-central1';
  async function call(data, token) {
    const response = await fetch(`${base}/saveAnnouncement`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ data }) });
    return { status: response.status, body: await response.json() };
  }
  const nonce = Date.now();
  async function account(role) {
    const email = `${role}-${nonce}@example.com`; const password = 'Emulator-only-password!';
    const user = await auth.createUser({ email, password });
    if (role === 'admin') await auth.setCustomUserClaims(user.uid, { admin: true });
    const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    const result = await response.json(); assert.ok(result.idToken); return result.idToken;
  }
  try {
    const adminToken = await account('admin'); const memberToken = await account('member');
    const now = Date.now();
    const announcement = { title: 'Integration service update', message: '<script>alert(1)</script> is plain text.', priority: 'urgent', enabled: true, publishAt: now - 1000, expiresAt: now + 60000, actionLabel: 'Visit details', actionUrl: '/service/' };
    assert.equal((await call({ announcement })).status, 403);
    assert.equal((await call({ announcement }, memberToken)).status, 403);
    const created = await call({ announcement }, adminToken);
    assert.equal(created.status, 200, JSON.stringify(created));
    const id = created.body.result.id;
    assert.ok(id);
    const saved = (await db.ref(`announcementState/records/${id}`).get()).val();
    const visible = (await db.ref(`announcementState/published/${id}`).get()).val();
    assert.equal(saved.title, announcement.title);
    assert.equal(visible.title, announcement.title);
    assert.equal(visible.updatedBy, undefined);
    const stale = await call({ id, expectedUpdatedAt: saved.updatedAt - 1, announcement }, adminToken);
    assert.equal(stale.status, 409);
    const unpublished = await call({ id, expectedUpdatedAt: saved.updatedAt, announcement: { ...announcement, enabled: false } }, adminToken);
    assert.equal(unpublished.status, 200);
    assert.equal((await db.ref(`announcementState/published/${id}`).get()).exists(), false);
    const invalid = await call({ announcement: { ...announcement, actionUrl: 'javascript:alert(1)' } }, adminToken);
    assert.equal(invalid.status, 400);
    const audit = (await db.ref('announcementState/audit').get()).val();
    assert.ok(Object.values(audit).some(entry => entry.announcementId === id));
    const functions = await import('../functions/index.mjs');
    const scheduledId = `scheduled-${nonce}`;
    await db.ref(`announcementState/records/${scheduledId}`).set({ ...announcement, title: 'Scheduled', publishAt: Date.now() - 100, expiresAt: Date.now() + 60000 });
    await functions.syncAnnouncements.run({ scheduleTime: new Date().toISOString() });
    assert.equal((await db.ref(`announcementState/published/${scheduledId}`).get()).exists(), true);
    await db.ref(`announcementState/records/${scheduledId}/expiresAt`).set(Date.now() - 1);
    await functions.syncAnnouncements.run({ scheduleTime: new Date().toISOString() });
    assert.equal((await db.ref(`announcementState/published/${scheduledId}`).get()).exists(), false);
    await db.ref('contactRateLimits/expired-test').set({ count: 2, expiresAt: Date.now() - 1 });
    await functions.cleanupContactLimits.run({ scheduleTime: new Date().toISOString() });
    assert.equal((await db.ref('contactRateLimits/expired-test').get()).exists(), false);
    const contact = await fetch(`${base}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' }, body: JSON.stringify({}) });
    assert.equal(contact.status, 503);
    const badOrigin = await fetch(`${base}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://unapproved.example' }, body: JSON.stringify({}) });
    assert.equal(badOrigin.status, 403);
    const hostingContact = await fetch('http://127.0.0.1:5000/api/contact/', { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4173' }, body: JSON.stringify({}) });
    assert.equal(hostingContact.status, 503, 'Hosting rewrite preserves contact POST and returns the disabled-service fallback.');
    const adminPage = await fetch('http://127.0.0.1:5000/admin/');
    if (process.platform === 'win32' && !adminPage.headers.get('content-security-policy')) {
      console.log('Windows Hosting emulator custom-header glob matching is unavailable; verify configured headers after deployment.');
    } else {
      assert.match(adminPage.headers.get('x-robots-tag'), /noindex/);
      assert.match(adminPage.headers.get('content-security-policy'), /object-src 'none'/);
    }
    console.log('Local functions: admin claim checks, create/unpublish, audit, stale edit rejection, URL validation, disabled mail fallback, and origin rejection passed.');
  } finally { await deleteApp(app); const { getApps } = require('firebase-admin/app'); for (const other of getApps()) await deleteApp(other); }
});
