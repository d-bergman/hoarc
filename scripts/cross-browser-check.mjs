import { webkit, chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const report = [];
for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/service/', '/about/', '/resources/', '/contact/', '/faq/']) {
        await page.goto(`http://127.0.0.1:4173${route}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} ${route}: ${width}px overflow`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4173/about/');
    await page.locator('[data-bio-trigger="larry"]').click();
    await page.locator('#bio-larry.show').waitFor();
    const modal = page.locator('#bio-larry');
    assert.equal(await modal.getAttribute('aria-modal'), 'true');
    await modal.locator('.modal-body').focus();
    await page.keyboard.press('End');
    await page.waitForFunction(() => document.querySelector('#bio-larry .modal-body').scrollTop > 0);
    await modal.getByRole('button', { name: 'Close', exact: true }).click();
    await modal.waitFor({ state: 'hidden' });
    await page.goto('http://127.0.0.1:4173/faq/');
    await page.locator('summary').nth(2).click();
    assert.equal(await page.locator('details').nth(2).getAttribute('open'), '');
    // A 320px CSS viewport verifies reflow equivalent to a 1280px viewport at 400% browser zoom.
    await page.setViewportSize({ width: 320, height: 700 });
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: enlarged text overflow`);
    await page.screenshot({ path: `artifacts/screenshots/faq-${name.toLowerCase()}-large-text.png`, fullPage: true });
    assert.deepEqual(errors, []);
    report.push({ engine: name, viewportWidths: [320, 390, 768, 1024, 1440], pages: 6, modalScrollAndClose: true, faqTouch: true, textEnlargement: '200% at 320px', errors });
  } finally { await browser.close(); }
}
await writeFile('artifacts/cross-browser-report.json', JSON.stringify(report, null, 2));
console.log('Cross-browser checks passed: Chromium and WebKit, six pages at five widths, modal scrolling, touch FAQ, and enlarged text.');
