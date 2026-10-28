import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts, launchPassed } from '../src/lib/countdown.mjs';
import { validateAnnouncement, publicProjection, activeAnnouncements, safeActionUrl } from '../functions/lib/announcements.mjs';
import { validateContact, contactMail } from '../functions/lib/contact.mjs';

const now = Date.parse('2026-12-05T16:00:00Z');
const deadline = '2026-12-06T10:00:00-06:00';
const record = { title: 'Sunday update', message: 'Meet on the first floor.', priority: 'normal', enabled: true, publishAt: now - 1000, expiresAt: now + 60000, actionLabel: '', actionUrl: '' };

test('countdown uses the Central Time launch instant and never goes negative', () => {
  assert.deepEqual(countdownParts(deadline, now), [1, 0, 0, 0]);
  assert.deepEqual(countdownParts(deadline, Date.parse(deadline) - 1000), [0, 0, 0, 1]);
  assert.deepEqual(countdownParts(deadline, Date.parse(deadline) + 100000), [0, 0, 0, 0]);
  assert.equal(launchPassed(deadline, Date.parse(deadline)), true);
  assert.equal(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(new Date(deadline)), '10');
});
test('only enabled and currently published notices enter the public projection', () => {
  const records = { current: { ...record, updatedBy: 'private-user', internal: 'never public' }, draft: { ...record, enabled: false }, expired: { ...record, expiresAt: now }, future: { ...record, publishAt: now + 1 } };
  const projected = publicProjection(records, now);
  assert.deepEqual(Object.keys(projected), ['current']);
  assert.equal(projected.current.updatedBy, undefined);
  assert.equal(projected.current.internal, undefined);
  assert.deepEqual(activeAnnouncements(projected, record.expiresAt), []);
});
test('urgent announcements sort first and arbitrary URL schemes are rejected', () => {
  assert.equal(activeAnnouncements({ normal: record, urgent: { ...record, priority: 'urgent' } }, now)[0].id, 'urgent');
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', '/\\evil.example', 'http://example.com', 'https://user:pass@example.com']) assert.equal(safeActionUrl(url), '');
  assert.equal(safeActionUrl('/service.html'), '/service.html');
  assert.equal(safeActionUrl('https://example.com/'), 'https://example.com/');
});
test('announcement validation rejects oversized, invalid, and unpaired action fields', () => {
  assert.equal(validateAnnouncement(record).title, record.title);
  for (const change of [{ title: '' }, { message: 'x'.repeat(2001) }, { priority: 'fake' }, { enabled: 'yes' }, { expiresAt: record.publishAt }, { publishAt: NaN }, { actionLabel: 'Click' }, { actionLabel: 'Click', actionUrl: 'javascript:alert(1)' }]) assert.throws(() => validateAnnouncement({ ...record, ...change }));
});
const visitor = { name: 'A Visitor', email: 'visitor@example.com', phone: '', subject: 'First visit', message: 'Where is the entrance?', consent: true, website: '' };
test('contact validation rejects email header injection and requires consent', () => {
  assert.equal(validateContact(visitor).email, visitor.email);
  for (const change of [{ email: 'a@example.com\r\nBcc: x@example.com' }, { name: 'Name\nBcc: x' }, { subject: 'Hello\r\nBcc: x' }, { consent: false }, { message: 'x'.repeat(5001) }, { website: 'bot.example' }]) assert.throws(() => validateContact({ ...visitor, ...change }));
});
test('mail always goes to the church with an authenticated From and visitor Reply-To', () => {
  const mail = contactMail(validateContact(visitor), 'web@church.example', new Date(now));
  assert.equal(mail.to, 'hoarc.church@gmail.com');
  assert.equal(mail.from, 'web@church.example');
  assert.equal(mail.replyTo.address, visitor.email);
  assert.match(mail.subject, /^HOARC Website Inquiry:/);
  assert.match(mail.text, /Where is the entrance/);
});
