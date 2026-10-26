import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { siteConfig } from '../src/config.mjs';

const walk = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
const files = await walk('dist');
const htmlFiles = files.filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${file}: one H1`);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /name="description"/);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  assert.ok(!/15 N\. Main|15 N Main|Firestore|firestore|col-[^" ]*__/.test(html), `${file}: stale address or database references`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    const target = path.join('dist', match[1]);
    const resolved = match[1].endsWith('/') ? path.join(target, 'index.html') : target;
    assert.ok(await stat(resolved).catch(() => false), `${file}: missing local target ${match[1]}`);
  }
  for (const match of html.matchAll(/class="([^"]*)"/g)) for (const name of match[1].split(/\s+/)) assert.ok(!/(__|--|_)/.test(name), `Disallowed custom class: ${name}`);
}
const about = await readFile('dist/about/index.html', 'utf8');
const people = JSON.parse(await readFile('src/data/people.json', 'utf8'));
for (const person of people) {
  for (const line of person.bio) assert.ok(about.includes(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')), `Missing complete bio text: ${person.name}`);
  assert.match(about, new RegExp(`/about/${person.id}/`));
}
assert.equal(siteConfig.launch, '2026-11-29T10:00:00-06:00');
const hosting = JSON.parse(await readFile('firebase.json', 'utf8')).hosting;
assert.ok(hosting.headers.some(rule => rule.headers.some(h => h.key === 'Content-Security-Policy' && h.value.includes("object-src 'none'"))));
assert.ok(hosting.headers.some(rule => rule.source.includes('admin') && rule.headers.some(h => h.key === 'X-Robots-Tag' && h.value.includes('noindex'))));
const meta = JSON.parse(await readFile('artifacts/bundle-meta.json', 'utf8'));
assert.ok(!Object.keys(meta.inputs).some(file => /firebase[/\\](firestore|storage)|@firebase[/\\](firestore|storage)/.test(file)), 'No Firestore or Storage SDK in website bundle');
console.log(`Static checks passed: ${htmlFiles.length} pages, local links/assets, IDs, complete biographies, and RTDB-only bundles.`);
