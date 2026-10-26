import { ref, onValue } from 'firebase/database';
import { db } from './firebase.mjs';
import { activeAnnouncements } from '../functions/lib/announcements.mjs';
import { announcementElement } from './lib/render-announcement.mjs';

export function watchAnnouncements() {
  const region = document.querySelector('#announcements');
  const target = document.querySelector('[data-announcements]');
  if (!region || !target) return;
  let records = {};
  let offset = 0;
  let lastUrgent = '';
  const render = () => {
    const active = activeAnnouncements(records, Date.now() + offset);
    const fragment = document.createDocumentFragment();
    for (const record of active) fragment.append(announcementElement(record, document));
    target.replaceChildren(fragment);
    region.hidden = active.length === 0;
    const urgent = active.filter(a => a.priority === 'urgent').map(a => a.id).join(',');
    if (urgent && urgent !== lastUrgent) {
      let status = document.querySelector('#urgent-announcement-status');
      if (!status) {
        status = document.createElement('p'); status.id = 'urgent-announcement-status'; status.className = 'visually-hidden'; status.setAttribute('role', 'status'); document.body.append(status);
      }
      setTimeout(() => { status.textContent = 'An important service update is available in the announcements section.'; }, 100);
    }
    lastUrgent = urgent;
  };
  onValue(ref(db, '.info/serverTimeOffset'), snapshot => { offset = snapshot.val() || 0; render(); });
  onValue(ref(db, 'announcementState/published'), snapshot => { records = snapshot.val() || {}; render(); }, () => {
    records = {}; render();
    // Evergreen service details remain available if the optional feed is unavailable.
  });
  setInterval(render, 1000);
}
