import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { firebaseConfig } from './config.mjs';
export const usingEmulators = __SITE_SETTINGS__.emulators === true;
if (usingEmulators && !['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error('Emulator mode is only available on localhost.');
export const app = initializeApp(usingEmulators ? { ...firebaseConfig, projectId: 'demo-hoarc', apiKey: 'demo-key', databaseURL: 'https://demo-hoarc-default-rtdb.firebaseio.com' } : firebaseConfig);
export const db = getDatabase(app);
if (usingEmulators) connectDatabaseEmulator(db, '127.0.0.1', 9000);
