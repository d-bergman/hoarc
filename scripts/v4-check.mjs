import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { basePath, pageRoute, publicUrl } from './routes.mjs';
const files = [...(await readdir('.')).filter(f => f.endsWith('.html')), ...(await readdir('about')).filter(f => f.endsWith('.html')).map(f => `about/${f}`)];
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
 const browser = await engine.launch();
 try {
  const context = await browser.newContext({ reducedMotion: 'reduce' }); const page = await context.newPage();
  for (const file of files) {
   const response = await page.goto(`http://127.0.0.1:4173${basePath}${pageRoute(file)}`);
   assert.equal(response.status(), 200, file);
   assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), publicUrl(file));
   const broken = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')).filter(href => href.startsWith('/hoarc') && /\.html(?:#|$)/.test(href)));
   assert.deepEqual(broken, [], `${file}: extension-free links`);
   await page.waitForFunction(() => document.querySelector('.navbar-brand img').complete);
   assert.ok(await page.locator('.navbar-brand img').evaluate(el => el.naturalWidth > 0), file);
  }
  await page.goto('http://127.0.0.1:4173/hoarc/faq');
  const items = page.locator('details.faq-item');
  await items.nth(0).locator('summary').click();
  await items.nth(1).locator('summary').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('details.faq-item[open]').length === 1);
  assert.equal(await items.nth(0).getAttribute('open'), null);
  assert.notEqual(await items.nth(1).getAttribute('open'), null);
  await items.nth(1).locator('summary').click(); assert.equal(await page.locator('details.faq-item[open]').count(), 0);
  await page.goto('http://127.0.0.1:4173/hoarc/contact');
  assert.equal(await page.locator('#contact-form').isVisible(), true);
  for (const field of ['first-name', 'last-name', 'email']) assert.equal(await page.locator(`#contact-${field}`).getAttribute('required'), '');
  await page.locator('#contact-email').fill('invalid-email'); assert.equal(await page.locator('#contact-email').evaluate(el => el.validity.valid), false);
  assert.equal(await page.getByRole('button', { name: 'Send message' }).isDisabled(), true, 'No unconfigured delivery claim.');
  const noJs = await browser.newContext({ javaScriptEnabled: false }); const native = await noJs.newPage();
  await native.goto('http://127.0.0.1:4173/hoarc/faq');
  await native.locator('details.faq-item summary').nth(0).click(); await native.locator('details.faq-item summary').nth(1).click();
  assert.equal(await native.locator('details.faq-item[open]').count(), 1);
  await noJs.close();
  console.log(`${name}: ${files.length} clean routes, FAQ exclusive/native/keyboard behavior, and required contact fields passed.`);
 } finally { await browser.close(); }
}
assert.ok(!(await readFile('events.html', 'utf8')).includes('These recordings preserve the history'));
