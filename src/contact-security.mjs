import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { firebaseConfig } from './config.mjs';

let appCheck;
export async function contactToken(settings) {
  // Only local browser fixtures use a stub. The server never bypasses verification.
  if (settings.emulators === true && ['localhost', '127.0.0.1'].includes(location.hostname)) return 'local-browser-fixture';
  if (!settings.appCheckSiteKey) throw new Error('Online messages are unavailable. Please email the church directly.');
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  appCheck ||= initializeAppCheck(app, { provider: new ReCaptchaV3Provider(settings.appCheckSiteKey), isTokenAutoRefreshEnabled: true });
  try { return (await getToken(appCheck, false)).token; }
  catch { throw new Error('We could not verify this submission. Please try again or email the church directly.'); }
}
