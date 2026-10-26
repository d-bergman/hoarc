import { safeActionUrl } from '../../functions/lib/announcements.mjs';

export function announcementElement(record, document) {
  const article = document.createElement('article');
  article.className = 'announcement';
  article.dataset.priority = record.priority;
  const heading = document.createElement('h3');
  heading.className = 'h5';
  heading.textContent = record.title;
  const message = document.createElement('p');
  message.textContent = record.message;
  const time = document.createElement('time');
  time.dateTime = new Date(record.publishAt).toISOString();
  time.textContent = `Posted ${new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' }).format(record.publishAt)} Central Time`;
  article.append(heading, message, time);
  const url = safeActionUrl(record.actionUrl);
  if (url && record.actionLabel) {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = `${record.actionLabel} →`;
    link.className = 'd-block mt-2';
    if (url.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; link.append(' (opens in a new tab)'); }
    article.append(link);
  }
  return article;
}
