import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAppCheck } from 'firebase-admin/app-check';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineBoolean, defineSecret, defineString } from 'firebase-functions/params';
import { createHmac } from 'node:crypto';
import nodemailer from 'nodemailer';
import { MAX_ANNOUNCEMENTS, validateAnnouncement, publicProjection } from './lib/announcements.mjs';
import { validateContact, contactMail, verifyContactApp } from './lib/contact.mjs';
import { updateAnnouncementState } from './lib/state.mjs';

const emulatorProject = process.env.FIREBASE_DATABASE_EMULATOR_HOST ? (process.env.GCLOUD_PROJECT || 'demo-hoarc') : null;
initializeApp(emulatorProject ? { projectId: emulatorProject, databaseURL: `https://${emulatorProject}-default-rtdb.firebaseio.com` } : undefined);
const db = getDatabase();
const smtpConfig = defineSecret('SMTP_CONFIG');
const contactHashKey = defineSecret('CONTACT_HASH_KEY');
const contactEnabled = defineBoolean('CONTACT_ENABLED', { default: false });
const allowedOrigins = defineString('ALLOWED_ORIGINS', { default: '' });

export const saveAnnouncement = onCall({ region: 'us-central1', maxInstances: 3, timeoutSeconds: 30 }, async request => {
  if (!request.auth || request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Administrator access is required.');
  let record;
  try { record = validateAnnouncement(request.data?.announcement); }
  catch (error) { throw new HttpsError('invalid-argument', error.message); }
  const requestedId = request.data?.id;
  if (requestedId != null && (typeof requestedId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(requestedId))) throw new HttpsError('invalid-argument', 'Invalid announcement ID.');
  const id = requestedId || db.ref('announcementState/records').push().key;
  const auditId = db.ref('announcementState/audit').push().key;
  let conflict = false;
  let tooMany = false;
  const result = await updateAnnouncementState(db, state => {
    conflict = false; tooMany = false;
    state ||= {};
    state.records ||= {};
    state.audit ||= {};
    const previous = state.records[id];
    if (requestedId && (!previous || previous.updatedAt !== request.data.expectedUpdatedAt)) { conflict = true; return; }
    if (!previous && Object.keys(state.records).length >= MAX_ANNOUNCEMENTS) { tooMany = true; return; }
    const now = Date.now();
    state.records[id] = { ...record, createdAt: previous?.createdAt || now, updatedAt: Math.max(now, (previous?.updatedAt || 0) + 1), updatedBy: request.auth.uid };
    state.audit[auditId] = { announcementId: id, action: previous ? 'update' : 'create', at: now, by: request.auth.uid, enabled: record.enabled };
    const keys = Object.keys(state.audit).sort();
    for (const key of keys.slice(0, Math.max(0, keys.length - 500))) delete state.audit[key];
    state.published = publicProjection(state.records, now);
    return state;
  });
  if (!result.committed) throw new HttpsError(conflict ? 'aborted' : 'resource-exhausted', conflict ? 'This announcement changed in another session. Reload and review before saving.' : tooMany ? 'The announcement limit has been reached. Contact the site administrator to archive old records.' : 'The announcement could not be saved.');
  return { id, ok: true };
});

export const syncAnnouncements = onSchedule({ schedule: 'every 1 minutes', timeZone: 'America/Chicago', region: 'us-central1', maxInstances: 1, timeoutSeconds: 30 }, async () => {
  await updateAnnouncementState(db, state => {
    if (!state) return;
    const published = publicProjection(state.records || {});
    if (JSON.stringify(state.published || {}) === JSON.stringify(published)) return;
    state.published = published;
    return state;
  });
});

export const contact = onRequest({ region: 'us-central1', maxInstances: 3, timeoutSeconds: 30, secrets: [smtpConfig, contactHashKey] }, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const origin = req.get('origin');
  const origins = allowedOrigins.value().split(',').map(s => s.trim()).filter(Boolean);
  if (!origin || !origins.includes(origin)) { res.status(403).json({ ok: false, message: 'This request is not allowed.' }); return; }
  res.set('Access-Control-Allow-Origin', origin); res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); res.set('Access-Control-Allow-Headers', 'Content-Type, X-Firebase-AppCheck');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.set('Allow', 'POST, OPTIONS').status(405).json({ ok: false, message: 'Use the contact form to send a message.' }); return; }
  if (!contactEnabled.value()) { res.status(503).json({ ok: false, message: 'Please email hoarc.church@gmail.com or call 815-406-9100.' }); return; }
  if (!req.is('application/json') || (req.rawBody?.length || 0) > 16384) { res.status(400).json({ ok: false, message: 'Please check the form and message length.' }); return; }
  try {
    await verifyContactApp(req.get('X-Firebase-AppCheck'), token => getAppCheck().verifyToken(token));
  } catch {
    res.status(403).json({ ok: false, message: 'We could not verify this submission. Please try again or email the church directly.' }); return;
  }
  let data;
  try { data = validateContact(req.body); }
  catch (error) { res.status(400).json({ ok: false, message: error.message }); return; }
  try {
    const now = Date.now();
    const key = createHmac('sha256', contactHashKey.value()).update(`${new Date(now).toISOString().slice(0, 10)}:${req.ip || 'unknown'}`).digest('hex');
    const quota = await db.ref(`contactRateLimits/${key}`).transaction(current => {
      if (!current || current.expiresAt <= now) return { count: 1, expiresAt: now + 15 * 60000 };
      if (current.count >= 5) return;
      return { ...current, count: current.count + 1 };
    });
    if (!quota.committed) { res.set('Retry-After', '900').status(429).json({ ok: false, message: 'Please wait before sending another message, or email us directly.' }); return; }
    const config = JSON.parse(smtpConfig.value());
    if (!config.host || !config.user || !config.pass || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(config.from) || ![465, 587].includes(Number(config.port))) throw new Error('SMTP is not configured.');
    const transport = nodemailer.createTransport({ host: config.host, port: Number(config.port), secure: Number(config.port) === 465, requireTLS: true, auth: { user: config.user, pass: config.pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 });
    const result = await transport.sendMail(contactMail(data, config.from));
    if (!result.accepted?.includes('hoarc.church@gmail.com')) throw new Error('Message was not accepted.');
    res.status(200).json({ ok: true });
  } catch {
    // Never log visitor details, SMTP credentials, or message content.
    res.status(503).json({ ok: false, message: 'Delivery could not be confirmed. Please email hoarc.church@gmail.com or call 815-406-9100.' });
  }
});

export const cleanupContactLimits = onSchedule({ schedule: 'every 24 hours', region: 'us-central1', maxInstances: 1 }, async () => {
  const expired = await db.ref('contactRateLimits').orderByChild('expiresAt').endAt(Date.now()).limitToFirst(10000).get();
  const updates = {};
  expired.forEach(child => { updates[child.key] = null; });
  if (Object.keys(updates).length) await db.ref('contactRateLimits').update(updates);
});
