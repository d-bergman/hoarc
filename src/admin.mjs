import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { app, db, usingEmulators } from './firebase.mjs';
import { validateAnnouncement } from '../functions/lib/announcements.mjs';
import { announcementElement } from './lib/render-announcement.mjs';

const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');
if (usingEmulators) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFunctionsEmulator(functions, '127.0.0.1', 5001); }
const save = httpsCallable(functions, 'saveAnnouncement');
const status = document.querySelector('#admin-status');
const login = document.querySelector('#admin-login');
const workspace = document.querySelector('#admin-workspace');
const form = document.querySelector('#announcement-form');
const saveButton = document.querySelector('#announcement-save');
const preview = document.querySelector('#announcement-preview');
let stopWatching;
let reviewed = '';
let revision = null;
let generation = 0;

function localDate(ms) { const date = new Date(ms); return new Date(ms - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function reset() {
  form.reset(); form.elements.id.value = ''; revision = null;
  form.elements.publishAt.value = localDate(Date.now());
  form.elements.expiresAt.value = localDate(Date.now() + 7 * 86400000);
  reviewed = ''; saveButton.disabled = true; preview.replaceChildren();
}
function formRecord() {
  const value = Object.fromEntries(new FormData(form));
  return validateAnnouncement({ ...value, enabled: form.elements.enabled.checked, publishAt: new Date(value.publishAt).getTime(), expiresAt: new Date(value.expiresAt).getTime() });
}
login.addEventListener('submit', async event => {
  event.preventDefault();
  const button = login.querySelector('button'); button.disabled = true;
  try { await signInWithEmailAndPassword(auth, document.querySelector('#admin-email').value, document.querySelector('#admin-password').value); login.reset(); }
  catch { status.textContent = 'Sign-in failed. Check your email and password, or contact the site administrator.'; }
  finally { button.disabled = false; }
});
document.querySelector('#admin-signout').addEventListener('click', () => signOut(auth));
document.querySelector('#admin-timezone').textContent = `Your current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Visitors see announcement dates in America/Chicago.`;
onAuthStateChanged(auth, async user => {
  const current = ++generation;
  stopWatching?.(); workspace.hidden = true; reset();
  if (!user) { login.hidden = false; status.textContent = 'Sign in with your approved administrator account.'; return; }
  login.hidden = true;
  try {
    const token = await user.getIdTokenResult(true);
    if (current !== generation) return;
    if (token.claims.admin !== true) {
      status.textContent = 'This account is not authorized to manage announcements. Contact the site administrator.';
      const out = document.createElement('button'); out.className = 'btn btn-outline-primary ms-3'; out.textContent = 'Sign out'; out.addEventListener('click', () => signOut(auth)); status.append(out); return;
    }
    workspace.hidden = false; status.textContent = 'Signed in. Preview changes before saving.';
    document.querySelector('#admin-user').textContent = user.email;
    stopWatching = onValue(ref(db, 'announcementState/records'), snapshot => {
      const target = document.querySelector('#announcement-list'); target.replaceChildren();
      const entries = Object.entries(snapshot.val() || {}).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
      if (!entries.length) target.textContent = 'No announcements yet.';
      for (const [id, record] of entries) {
        const article = document.createElement('article'); article.className = 'admin-record';
        const title = document.createElement('h3'); title.className = 'h5'; title.textContent = record.title;
        const info = document.createElement('p'); info.textContent = `${!record.enabled ? 'Draft / unpublished' : record.expiresAt <= Date.now() ? 'Expired' : record.publishAt > Date.now() ? 'Scheduled' : 'Published'} · Updated ${new Date(record.updatedAt).toLocaleString()}`;
        const edit = document.createElement('button'); edit.className = 'btn btn-outline-primary'; edit.type = 'button'; edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
          reset(); form.elements.id.value = id; revision = record.updatedAt;
          for (const name of ['title', 'message', 'priority', 'actionLabel', 'actionUrl']) form.elements[name].value = record[name] || '';
          form.elements.enabled.checked = record.enabled;
          form.elements.publishAt.value = localDate(record.publishAt); form.elements.expiresAt.value = localDate(record.expiresAt);
          form.elements.title.focus();
        });
        article.append(title, info, edit); target.append(article);
      }
    }, () => { status.textContent = 'Announcements could not be loaded. Check your connection and administrator access.'; });
  } catch { status.textContent = 'Administrator access could not be checked. Please sign out and try again.'; await signOut(auth); }
});
form.addEventListener('input', () => { reviewed = ''; saveButton.disabled = true; });
document.querySelector('#announcement-preview-button').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  try { const record = formRecord(); reviewed = JSON.stringify(record); preview.replaceChildren(announcementElement(record, document)); saveButton.disabled = false; }
  catch (error) { status.textContent = error.message; }
});
document.querySelector('#announcement-reset').addEventListener('click', reset);
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const record = formRecord();
    if (JSON.stringify(record) !== reviewed) throw new Error('Preview the current version before saving.');
    saveButton.disabled = true;
    await save({ id: form.elements.id.value || null, expectedUpdatedAt: revision, announcement: record });
    status.textContent = record.enabled ? 'Saved. Publication follows the scheduled dates.' : 'Draft saved privately.';
    reset();
  } catch (error) { status.textContent = error.message || 'Could not save. Please check your connection.'; saveButton.disabled = false; }
});
reset();
