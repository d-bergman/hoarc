export const MAX_ANNOUNCEMENTS = 50;

export function safeActionUrl(value) {
  if (!value) return '';
  if (/^\/(?!\/)[^\s\\]*$/.test(value) && !/[\x00-\x1f\x7f]/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function validateAnnouncement(input) {
  if (!input || typeof input !== 'object') throw new Error('An announcement is required.');
  const { title, message, priority, publishAt, expiresAt, enabled } = input;
  if (typeof title !== 'string' || !title.trim() || title.length > 120) throw new Error('Enter a title of 1–120 characters.');
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) throw new Error('Enter a message of 1–2,000 characters.');
  if (!['normal', 'important', 'urgent'].includes(priority)) throw new Error('Choose a valid priority.');
  if (!Number.isSafeInteger(publishAt) || !Number.isSafeInteger(expiresAt) || publishAt < 0 || expiresAt <= publishAt || expiresAt - publishAt > 366 * 86400000) throw new Error('Choose an expiry after publication, within one year.');
  if (typeof enabled !== 'boolean') throw new Error('Choose whether to publish.');
  const actionLabel = input.actionLabel || '';
  const actionUrl = input.actionUrl || '';
  if (typeof actionLabel !== 'string' || actionLabel.length > 60 || typeof actionUrl !== 'string' || actionUrl.length > 1000) throw new Error('Check the action label and URL.');
  if (!!actionLabel.trim() !== !!actionUrl || (actionUrl && !safeActionUrl(actionUrl))) throw new Error('An action needs a label and a local path or HTTPS link.');
  return { title: title.trim(), message: message.trim(), priority, publishAt, expiresAt, enabled, actionLabel: actionLabel.trim(), actionUrl: safeActionUrl(actionUrl) };
}

export function activeAnnouncements(records = {}, now = Date.now()) {
  return Object.entries(records || {}).filter(([, a]) => a && a.enabled && a.publishAt <= now && a.expiresAt > now)
    .map(([id, a]) => ({ id, ...a }))
    .sort((a, b) => ({ urgent: 0, important: 1, normal: 2 }[a.priority] - { urgent: 0, important: 1, normal: 2 }[b.priority]) || b.publishAt - a.publishAt);
}

export function publicProjection(records, now = Date.now()) {
  return Object.fromEntries(activeAnnouncements(records, now).map(({ id, title, message, priority, publishAt, expiresAt, actionLabel, actionUrl }) => [id, { title, message, priority, publishAt, expiresAt, actionLabel, actionUrl, enabled: true }]));
}
