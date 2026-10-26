// Run from functions/ with Application Default Credentials for the selected project.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const [uid, action] = process.argv.slice(2);
if (!uid || !['grant', 'revoke'].includes(action)) throw new Error('Usage: node scripts/set-admin.mjs FIREBASE_UID grant|revoke');
initializeApp({ projectId: 'hoarc-a5afd' });
const auth = getAuth();
const user = await auth.getUser(uid);
const claims = { ...user.customClaims };
if (action === 'grant') claims.admin = true; else delete claims.admin;
await auth.setCustomUserClaims(uid, claims);
if (action === 'revoke') await auth.revokeRefreshTokens(uid);
console.log(`Administrator access ${action === 'grant' ? 'granted' : 'revoked'} for ${uid}. Sign out and back in to refresh claims.`);
