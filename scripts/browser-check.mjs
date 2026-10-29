import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.HOARC_PREVIEW || 'http://127.0.0.1:4173';
await mkdir('artifacts/screenshots', { recursive: true });
const report = { timestamp: new Date().toISOString(), engine: 'Chromium', pages: [], interactions: [] };
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/service.html', '/about.html', '/resources.html', '/events.html', '/contact.html', '/faq.html', '/privacy.html', '/accessibility.html', '/admin.html']) {
    const response = await page.goto(`${base}${route}`);
    assert.equal(response.status(), 200);
    await page.waitForLoadState('networkidle');
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    report.pages.push({ route, viewport: 'desktop', violations: a11y.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
    assert.equal(await page.locator('h1').count(), 1);
    await page.screenshot({ path: `artifacts/screenshots/${route.replace(/\//g, '') || 'home'}-desktop.png`, fullPage: true });
  }
  await page.goto(`${base}/about.html`);
  for (const name of ['larry', 'donna', 'sheree', 'darren', 'bhumika']) {
    const trigger = page.locator(`[data-bio-trigger="${name}"]`);
    await trigger.click();
    await page.locator(`#bio-${name}.show`).waitFor();
    assert.equal(await page.locator(`#bio-${name}`).getAttribute('aria-modal'), 'true');
    const modalAxe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    report.pages.push({ route: `/about.html#bio-${name}`, viewport: 'desktop-modal', violations: modalAxe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
    await page.keyboard.press('Escape');
    await page.locator(`#bio-${name}`).waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'Modal focus returns to the opener');
  }
  report.interactions.push('All five biography modals open, close with Escape, and restore focus.');
  await page.goto(`${base}/faq.html`);
  const summary = page.locator('details').nth(1).locator('summary');
  await summary.focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').nth(1).getAttribute('open'), '');
  report.interactions.push('FAQ works with the keyboard.');
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ['/', '/service.html', '/about.html', '/resources.html', '/events.html', '/contact.html', '/faq.html', '/admin.html']) {
    await page.goto(`${base}${route}`);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false, `${route}: horizontal overflow at 320px`);
    const a11y = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    report.pages.push({ route, viewport: '320px', violations: a11y.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
    await page.screenshot({ path: `artifacts/screenshots/${route.replace(/\//g, '') || 'home'}-mobile.png`, fullPage: true });
  }
  await page.goto(`${base}/`);
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('.navbar-toggler').getAttribute('aria-expanded') === 'false');
  assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'false');
  report.interactions.push('Mobile menu toggles and Escape closes it with focus restoration.');
  await page.goto(`${base}/about.html`);
  await page.locator('[data-bio-trigger="bhumika"]').click();
  await page.locator('#bio-bhumika.show').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: 'artifacts/screenshots/bio-mobile.png', fullPage: true });
  await page.keyboard.press('Escape');
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const fallback = await noJs.newPage();
  await fallback.goto(`${base}/about.html`);
  await fallback.locator('[data-bio-trigger="darren"]').click();
  assert.ok(fallback.url().endsWith('/hoarc/about/darren'));
  assert.ok((await fallback.locator('main').textContent()).includes('Above all, Darren desires'));
  await fallback.goto(`${base}/faq.html`);
  await fallback.locator('summary').nth(1).click();
  assert.equal(await fallback.locator('details').nth(1).getAttribute('open'), '');
  report.interactions.push('Without JavaScript: biography links and FAQ answers remain usable.');
  await noJs.close();
  await page.clock.install({ time: new Date('2026-12-06T16:00:01Z') });
  await page.goto(`${base}/`);
  assert.match(await page.locator('[data-countdown]').textContent(), /Join us Sundays/);
  assert.equal(await page.locator('[data-countdown-part]').count(), 0);
  report.interactions.push('After launch, countdown becomes an evergreen Sunday invitation.');
  report.javascriptErrors = errors;
  await writeFile('artifacts/browser-report.json', JSON.stringify(report, null, 2));
  const violations = report.pages.flatMap(p => p.violations.map(v => `${p.route} (${p.viewport}): ${v.id}`));
  assert.deepEqual(errors, [], 'No uncaught JavaScript errors');
  assert.deepEqual(violations, [], 'No automated WCAG A/AA violations');
  console.log(`Browser checks passed: ${report.pages.length} page/viewport/modal scans; ${report.interactions.length} interaction groups.`);
} finally { await writeFile('artifacts/browser-report.json', JSON.stringify(report, null, 2)); await browser.close(); }
