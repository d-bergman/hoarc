import { readFile, writeFile, rm, readdir, access } from 'node:fs/promises';
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import { homedir } from 'node:os';

await access('functions/node_modules/firebase-admin/package.json').catch(() => { throw new Error('Run npm --prefix functions ci first.'); });
const env = { ...process.env };
if (!env.JAVA_HOME) {
  const cache = path.join(homedir(), '.cache/hoarc-tools');
  const jdk = (await readdir(cache).catch(() => [])).find(name => name.startsWith('jdk-21'));
  if (jdk) env.JAVA_HOME = path.join(cache, jdk);
}
if (env.JAVA_HOME) {
  const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'PATH';
  env[pathKey] = path.join(env.JAVA_HOME, 'bin') + path.delimiter + (env[pathKey] || '');
}
const files = {
  'functions/.env.demo-hoarc': 'CONTACT_ENABLED=false\nALLOWED_ORIGINS=http://127.0.0.1:4173\n',
  'functions/.secret.local': 'SMTP_CONFIG={"host":"invalid.local","port":587,"user":"emulator","pass":"not-a-real-secret","from":"web@example.com"}\nCONTACT_HASH_KEY=emulator-only-not-a-real-secret\n',
};
const backups = new Map();
const preview = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: '4174', HOARC_PREVIEW_ROOT: 'dist' }, stdio: 'inherit' });
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if ((await fetch('http://127.0.0.1:4174/').catch(() => null))?.ok) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Integration preview did not start.');
  for (const [file, content] of Object.entries(files)) {
    backups.set(file, await readFile(file).catch(() => null));
    await writeFile(file, content);
  }
  execFileSync(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js', 'emulators:exec', '--only', 'auth,database,functions,hosting', '--project', 'demo-hoarc', 'node --test tests/functions.integration.test.mjs && node scripts/emulator-browser-check.mjs'], { stdio: 'inherit', env });
} finally {
  preview.kill();
  for (const [file, previous] of backups) {
    if (previous) await writeFile(file, previous); else await rm(file, { force: true });
  }
}
