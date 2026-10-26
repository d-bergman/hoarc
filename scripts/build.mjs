import { readFile, writeFile, mkdir, cp, readdir, rm } from 'node:fs/promises';
import { build } from 'esbuild';
import path from 'node:path';

const settings = JSON.parse(await readFile(process.env.HOARC_SETTINGS || 'site.settings.json', 'utf8'));
const root = path.resolve('.');
const output = path.resolve('dist');
if (path.dirname(output) !== root) throw new Error('Build output must stay inside this repository.');
await rm(output, { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await cp('assets', 'dist/assets', { recursive: true });
for (const file of await readdir('.')) {
  if (file.endsWith('.html') || ['robots.txt', 'sitemap.xml', 'favicon.png'].includes(file)) await cp(file, `dist/${file}`);
}
await cp('about', 'dist/about', { recursive: true });

// HTML and CSS are tracked source files. Only JavaScript modules are bundled.
const bundleDirectory = process.env.HOARC_SETTINGS ? 'dist/assets' : 'assets';
const result = await build({ entryPoints: { site: 'src/site.mjs', admin: 'src/admin.mjs' }, outdir: bundleDirectory, bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2020'], metafile: true, define: { __SITE_SETTINGS__: JSON.stringify(settings) } });
if (!process.env.HOARC_SETTINGS) await cp('assets', 'dist/assets', { recursive: true });
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/bundle-meta.json', JSON.stringify(result.metafile, null, 2));
console.log('Packaged tracked HTML/CSS/images into dist and bundled JavaScript. Source HTML was not changed.');
