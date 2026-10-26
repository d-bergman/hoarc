import Collapse from 'bootstrap/js/dist/collapse.js';
import 'bootstrap/js/dist/modal.js';
import { siteConfig } from './config.mjs';
import { countdownParts, launchPassed } from './lib/countdown.mjs';

const settings = __SITE_SETTINGS__;
document.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
const countdown = document.querySelector('[data-countdown]');
function updateLaunch() {
  if (launchPassed(siteConfig.launch)) {
    document.querySelectorAll('[data-launch-copy]').forEach(el => { el.hidden = true; });
    if (countdown && !countdown.dataset.finished) {
      countdown.dataset.finished = 'true';
      countdown.replaceChildren();
      const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'Sunday worship';
      const invitation = document.createElement('p'); invitation.className = 'countdown-date mb-0'; invitation.textContent = 'Join us Sundays at 10:00 a.m.';
      countdown.append(eyebrow, invitation);
    }
    return true;
  }
  if (countdown) countdownParts(siteConfig.launch).forEach((value, i) => { countdown.querySelector(`[data-countdown-part="${i}"]`).textContent = String(value).padStart(2, '0'); });
  return false;
}
if (!updateLaunch()) { const timer = setInterval(() => { if (updateLaunch()) clearInterval(timer); }, 1000); }
document.querySelectorAll('[data-bio-trigger]').forEach(trigger => {
  trigger.addEventListener('click', event => {
    event.preventDefault();
    const modal = document.getElementById(`bio-${trigger.dataset.bioTrigger}`);
    modal.addEventListener('hidden.bs.modal', () => trigger.focus(), { once: true });
  });
});
const mobileNav = document.querySelector('#main-nav');
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (mobileNav?.classList.contains('show') || mobileNav?.classList.contains('collapsing'))) {
    if (mobileNav.classList.contains('collapsing')) mobileNav.addEventListener('shown.bs.collapse', () => Collapse.getOrCreateInstance(mobileNav).hide(), { once: true });
    else Collapse.getOrCreateInstance(mobileNav).hide();
    document.querySelector('.navbar-toggler').focus();
  }
});
// ResizeObserver keeps anchor and keyboard-focus offsets aligned with a wrapped header.
const header = document.querySelector('.site-header');
new ResizeObserver(() => document.documentElement.style.scrollPaddingTop = `${header.offsetHeight + 20}px`).observe(header);

if (settings.announcementsEnabled && document.querySelector('[data-announcements]')) import('./announcements.mjs').then(({ watchAnnouncements }) => watchAnnouncements()).catch(() => {});
const form = document.querySelector('#contact-form');
if (form) form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const status = document.querySelector('#contact-status');
  const button = form.querySelector('[type="submit"]');
  const values = Object.fromEntries(new FormData(form)); values.consent = form.elements.consent.checked;
  status.textContent = 'Sending your message…'; button.disabled = true;
  try {
    const response = await fetch(settings.contactEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.message || 'We could not send your message. Please email or call us.');
    status.textContent = 'Your message has been accepted for delivery. Thank you for getting in touch.';
    form.reset();
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' ? 'Delivery could not be confirmed. Please email or call us before trying again.' : error.message;
  } finally { button.disabled = false; status.focus(); }
});
