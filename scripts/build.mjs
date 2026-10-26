import { readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises';
import { build } from 'esbuild';
import { createTemplates } from '../src/templates.mjs';
import { prepareAssets } from './prepare-assets.mjs';

const settings = JSON.parse(await readFile(process.env.HOARC_SETTINGS || 'site.settings.json', 'utf8'));
if (settings.emulators && settings.publicLaunch) throw new Error('Emulator builds cannot be published.');
if (settings.publicLaunch && (!settings.siteUrl || new URL(settings.siteUrl).protocol !== 'https:')) throw new Error('Public launch requires the approved HTTPS domain in site.settings.json.');
if (settings.scriptureWidgetEnabled) throw new Error('Scripture widget is not approved. Use the official link fallback until licensing and translation are confirmed.');
try { await stat('src/data/images.json'); } catch { await prepareAssets(); }
const images = JSON.parse(await readFile('src/data/images.json', 'utf8'));
const people = JSON.parse(await readFile('src/data/people.json', 'utf8'));
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('node_modules/bootstrap/dist/css/bootstrap.min.css', 'dist/assets/bootstrap.min.css');
await cp('src/site.css', 'dist/assets/site.css');
await cp('src/no-script.css', 'dist/assets/no-script.css');
await build({ entryPoints: { site: 'src/site.mjs', admin: 'src/admin.mjs' }, outdir: 'dist/assets', bundle: true, splitting: true, format: 'esm', minify: true, target: ['es2020'], metafile: true, define: { __SITE_SETTINGS__: JSON.stringify(settings) } }).then(async result => {
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/bundle-meta.json', JSON.stringify(result.metafile, null, 2));
});
const { pages, page } = createTemplates(images, people, settings);
for (const p of pages) {
  const file = p.path === '/404.html' ? 'dist/404.html' : `dist${p.path}index.html`;
  await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  await writeFile(file, page(p));
}
const publicPages = pages.filter(p => !p.noindex);
await writeFile('dist/robots.txt', settings.publicLaunch ? `User-agent: *\nAllow: /\nDisallow: /admin/\n${settings.siteUrl ? `Sitemap: ${new URL('/sitemap.xml', settings.siteUrl).href}\n` : ''}` : 'User-agent: *\nDisallow: /\n');
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${settings.publicLaunch ? publicPages.map(p => `<url><loc>${new URL(p.path, settings.siteUrl).href}</loc></url>`).join('') : ''}</urlset>`);
console.log(`Built ${pages.length} HTML pages. Mode: ${settings.publicLaunch ? 'public' : 'staging (noindex)'}. Contact form: ${settings.contactEnabled ? 'enabled' : 'direct email fallback'}.`);
