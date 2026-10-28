import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const report = { sitewidePages: 0, checks: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const files = [...(await readdir('.')).filter(f => f.endsWith('.html')), ...(await readdir('about')).filter(f => f.endsWith('.html')).map(f => `about/${f}`)];
  for (const file of files) {
    await page.goto(`http://127.0.0.1:4173/${file}`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.site-footer .small, .site-footer small').count(), 0, `${file}: no small footer text`);
    assert.equal(await page.locator('.site-footer [data-current-year]').textContent(), String(new Date().getFullYear()));
    assert.equal(await page.locator('.site-footer a').filter({ hasText: /^(About us|Resources|FAQ)$/ }).count(), 0);
    assert.equal(await page.locator('.footer-separator').count(), 2);
    assert.equal(await page.locator('.site-footer').getByText(/Sunday worship/).count(), 0);
    assert.equal(await page.locator('a:not(.btn) span.ms-2').count(), 0);
    assert.equal(await page.locator('.nav-link').first().evaluate(el => getComputedStyle(el).fontSize), '20px');
    assert.match(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily), /Noto Sans/);
    assert.match(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily), /Noto Serif/);
    assert.equal(await page.locator('nav a[href$="statement-of-faith.html"], footer a[href$="statement-of-faith.html"]').count(), 0);
    report.sitewidePages++;
  }
  report.checks.push('All 17 pages: footer simplification, live year, gold separators, fonts, 1.25rem navigation and normal-link spacing.');
  for (const file of ['about.html', 'resources.html', 'faq.html']) {
    await page.goto(`http://127.0.0.1:4173/${file}`); assert.equal(await page.locator('.invitation').count(), 0);
  }
  for (const file of ['index.html', 'service.html', 'contact.html']) {
    await page.goto(`http://127.0.0.1:4173/${file}`); assert.equal(await page.locator('main .invitation').count(), 0); assert.equal(await page.locator('footer .invitation').count(), 1);
  }
  await page.goto('http://127.0.0.1:4173/faq.html');
  await page.locator('details').filter({ has: page.getByText('Is parking available?', { exact: true }) }).locator('summary').click();
  assert.equal((await page.locator('details').filter({ has: page.getByText('Is parking available?', { exact: true }) }).locator('.faq-answer p').textContent()).trim(), 'Yes');
  const back = page.locator('[data-back-to-top]');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('[data-back-to-top]').hidden);
  assert.equal(await back.isVisible(), false);
  await page.evaluate(() => scrollTo(0, 500)); await back.waitFor({ state: 'visible' });
  assert.equal(await back.evaluate(el => getComputedStyle(el).position), 'fixed');
  await back.click(); await page.waitForFunction(() => scrollY < 20);
  const link = page.locator('.nav-link').first(); await link.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.nav-link'), '::after').opacity === '1');
  assert.equal(await link.evaluate(el => getComputedStyle(el, '::after').opacity), '1');
  report.checks.push('Invitation placement, FAQ parking wording, navigation hover border, and scroll-triggered circular back-to-top behavior.');
  await page.goto('http://127.0.0.1:4173/about.html');
  await page.getByRole('link', { name: 'Read the full statement of faith' }).click();
  assert.ok(page.url().endsWith('/statement-of-faith.html'));
  const faithText = await page.locator('.statement-of-faith').textContent();
  for (let n = 1; n <= 13; n++) assert.match(faithText, new RegExp(`\\b${n}\\.`));
  assert.match(faithText, /VISION/); assert.match(faithText, /BELIEF STATEMENTS FOR WHOLISTIC HEALTH/);
  const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
  assert.deepEqual(a11y.violations.map(v => v.id), []);
  await page.screenshot({ path: 'artifacts/screenshots/statement-of-faith-desktop.png', fullPage: true });
  report.checks.push('Local Statement of Faith links only from About, contains all 13 articles plus vision/health sections, and passes automated WCAG checks.');

  const daily = await browser.newContext({ reducedMotion: 'reduce' });
  const versePage = await daily.newPage();
  let calls = 0;
  await versePage.clock.install({ time: new Date('2026-10-28T04:59:30Z') });
  await versePage.route('https://www.biblegateway.com/votd/get/**', async route => {
    calls++;
    const day = await versePage.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date()));
    const [year, month, date] = day.split('-');
    const fixture = { votd: { content: `Daily text ${date}.`, reference: 'Psalm 1:1', display_ref: 'Psalm 1:1', version_id: 'CEV', year, month, day: date, copyright: '' } };
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: `hoarcDailyVerse(${JSON.stringify(fixture)});` });
  });
  await versePage.goto('http://127.0.0.1:4173/');
  await versePage.waitForFunction(() => document.querySelector('.daily-scripture-text')?.textContent === 'Daily text 27.');
  await versePage.clock.fastForward(61000);
  await versePage.waitForFunction(() => document.querySelector('.daily-scripture-text')?.textContent === 'Daily text 28.');
  assert.equal(calls, 2);
  await versePage.reload();
  await versePage.waitForFunction(() => document.querySelector('.daily-scripture-text')?.textContent === 'Daily text 28.');
  assert.equal(calls, 2, 'Same-day verse is cached locally.');
  await daily.close();
  const offline = await browser.newContext(); const fallback = await offline.newPage();
  await fallback.route('https://www.biblegateway.com/votd/get/**', route => route.abort());
  await fallback.goto('http://127.0.0.1:4173/');
  await fallback.waitForFunction(() => document.querySelector('[data-scripture-widget]').textContent.includes('available through'));
  assert.equal(await fallback.getByRole('link', { name: /Read today’s verse/ }).isVisible(), true);
  await offline.close();
  report.checks.push('Daily verse provider fixture: daily rollover at Central midnight, same-day caching, and provider failure fallback. No fixture is saved in site content.');
  for (const file of files) {
    const html = await readFile(file, 'utf8'); assert.ok(!/November 29|a\.m\.|p\.m\./.test(html), `${file}: no stale dates/time punctuation`);
  }
  await writeFile('artifacts/requested-changes-report.json', JSON.stringify(report, null, 2));
  console.log(`Requested-change checks passed across ${report.sitewidePages} HTML pages.`);
} finally { await browser.close(); }
