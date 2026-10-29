import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const base = process.env.HOARC_PREVIEW || 'http://127.0.0.1:4173';
const expected = ['fndQnI84qLI', 'q4oVU-7Bu_I', 'MR-jPNLkYHI', 'LiKGpBm1_KY', 'UR022HsYo6k', 'b1NOJhj-X4I'];
const files = [...(await readdir('.')).filter(f => f.endsWith('.html')), ...(await readdir('about')).filter(f => f.endsWith('.html')).map(f => `about/${f}`)];
const report = { pages: files.length, engines: [], checks: [] };
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/events.html`);
    const cards = page.locator('.recording-card');
    assert.equal(await cards.count(), 6);
    assert.deepEqual(await cards.locator('a').evaluateAll(links => links.map(link => new URL(link.href).pathname.split('/').pop())), expected);
    const dates = await cards.locator('time').evaluateAll(times => times.map(time => time.dateTime));
    assert.deepEqual(dates, [...dates].sort().reverse());
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.getByRole('heading', { name: /Upcoming|Coming Soon/i }).count(), 0);
    assert.equal(await page.locator('nav a[aria-current="page"]').textContent(), 'Events');
    for (const image of await cards.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await image.elementHandle());
      assert.equal(await image.getAttribute('loading'), 'lazy');
      assert.ok(await image.evaluate(el => Math.abs(el.getBoundingClientRect().width / el.getBoundingClientRect().height - 16 / 9) < .01));
    }
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(schema['@type'], 'CollectionPage'); assert.equal(schema.mainEntity['@type'], 'ItemList');
    assert.equal(schema.mainEntity.numberOfItems, 6);
    assert.deepEqual(schema.mainEntity.itemListElement.map(item => new URL(item.url).pathname.split('/').pop()), expected);
    assert.ok((await page.title()).includes('Events & Revival Recordings'));
    assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /Watch past Healing of America/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(canonical, 'https://hoarc-a5afd.web.app/events.html');
    assert.ok((await readFile('sitemap.xml', 'utf8')).includes(canonical));
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://hoarc-a5afd.web.app/assets/images/social-share.jpg');
    assert.equal(await page.locator('h1').count(), 1);
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    assert.deepEqual(a11y.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) })), []);
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await page.waitForFunction(() => scrollY === 0);
    await page.screenshot({ path: `artifacts/screenshots/events-${name.toLowerCase()}-desktop.png`, fullPage: true });
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(`${base}/events.html`);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: ${width}px overflow`);
      const columns = await page.locator('[data-recordings] > div').evaluateAll(items => items.filter(item => item.offsetTop === items[0].offsetTop).length);
      assert.equal(columns, width >= 992 ? 3 : width >= 768 ? 2 : 1);
      let aboutHeight;
      for (const file of ['about.html', 'service.html']) {
        await page.goto(`${base}/${file}`); await page.evaluate(() => document.fonts.ready);
        const height = await page.locator('.page-hero').evaluate(el => el.getBoundingClientRect().height);
        if (file === 'about.html') aboutHeight = height;
        else assert.ok(Math.abs(height - aboutHeight) < 1, `${name} ${width}px: Service/About hero heights ${height}/${aboutHeight}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`${base}/events.html`);
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.getByRole('navigation').getByRole('link', { name: 'Events', exact: true }).focus();
    assert.equal(await page.locator('nav a[aria-current="page"]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelector('.navbar-toggler').getAttribute('aria-expanded') === 'false');
    await page.screenshot({ path: `artifacts/screenshots/events-${name.toLowerCase()}-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: 200% text overflow`);
    assert.deepEqual(errors, []);
    if (name === 'Chromium') {
      for (const file of files) {
        await page.goto(`${base}/${file}`);
        assert.equal(await page.locator('nav a[href$="events.html"]').count(), 1, file);
        assert.equal(await page.locator('nav a[href$="faq.html"]').count(), 0, file);
        assert.equal(await page.locator('footer a[href$="faq.html"]').count(), 1, file);
        assert.equal(await page.locator('footer a').filter({ hasText: /^Plan your visit$/ }).count(), 0, file);
        assert.match(await page.locator('.navbar-brand img').getAttribute('src'), /hoarc-horizontal-main-new.webp$/);
      }
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false }); const staticPage = await noJs.newPage();
    const remoteRequests = []; staticPage.on('request', request => { if (!request.url().startsWith(base)) remoteRequests.push(request.url()); });
    await staticPage.goto(`${base}/events.html`);
    assert.equal(await staticPage.getByRole('link', { name: /^Watch Recording/ }).count(), 6);
    assert.deepEqual(remoteRequests, [], 'Archive loads without contacting YouTube or another third party.');
    await noJs.close(); report.engines.push(name);
  } finally { await browser.close(); }
}
report.checks = ['Six exact links and dates; newest first; local genuine thumbnails; no players or third-party page requests.', 'Metadata, canonical, sitemap, CollectionPage/ItemList, WCAG scans, mobile navigation, 200% text and 1/2/3-column layouts.', 'Shared Service/About hero heights at six widths; navigation/footer/new-logo consistency on all source pages.'];
await writeFile('artifacts/events-report.json', JSON.stringify(report, null, 2));
console.log(`Events checks passed: ${report.pages} pages, Chromium/WebKit, six responsive widths, accessibility and static recordings.`);
