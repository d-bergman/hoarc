const endpoint = 'https://www.biblegateway.com/votd/get/';
export function centralDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
function plainText(value) {
  return new DOMParser().parseFromString(String(value || ''), 'text/html').body.textContent.trim();
}
function requestVerse() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => finish(new Error('Verse service timed out.')), 7000);
    const finish = (error, data) => {
      clearTimeout(timer); script.remove();
      // Leave a harmless callback for a delayed provider response after a timeout.
      window.hoarcDailyVerse = () => {};
      error ? reject(error) : resolve(data);
    };
    window.hoarcDailyVerse = payload => {
      const verse = payload?.votd;
      if (!verse?.content || !verse.reference || verse.version_id !== 'CEV') { finish(new Error('Invalid verse response.')); return; }
      const date = `${verse.year}-${String(verse.month).padStart(2, '0')}-${String(verse.day).padStart(2, '0')}`;
      if (date !== centralDay()) { finish(new Error('The provider has not returned today’s verse.')); return; }
      finish(null, { date, text: plainText(verse.content), reference: plainText(verse.display_ref || verse.reference), copyright: plainText(verse.copyright) });
    };
    const url = new URL(endpoint);
    url.search = new URLSearchParams({ format: 'json', version: 'CEV', callback: 'hoarcDailyVerse' });
    script.src = url.href; script.async = true; script.onerror = () => finish(new Error('Verse service unavailable.'));
    document.head.append(script);
  });
}
export function startDailyScripture() {
  const target = document.querySelector('[data-scripture-widget]');
  if (!target) return;
  const cacheKey = 'hoarc-daily-scripture-cev';
  let displayedDay = '';
  let loading = false;
  async function refresh() {
    const today = centralDay();
    if (loading || displayedDay === today) return;
    loading = true;
    try {
      let cached;
      try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
      const verse = cached?.date === today ? cached : await requestVerse();
      if (verse.date !== centralDay()) return;
      const block = document.createElement('blockquote'); block.className = 'daily-scripture';
      const text = document.createElement('p'); text.className = 'daily-scripture-text'; text.textContent = verse.text;
      const citation = document.createElement('cite'); citation.textContent = `${verse.reference} · CEV`;
      const attribution = document.createElement('p'); attribution.className = 'scripture-attribution';
      const provider = document.createElement('a'); provider.href = 'https://www.biblegateway.com/'; provider.textContent = 'Powered by BibleGateway.com';
      attribution.append(provider);
      if (verse.copyright) attribution.append(` · ${verse.copyright}`);
      block.append(text, citation, attribution); target.replaceChildren(block);
      displayedDay = today;
      try { localStorage.setItem(cacheKey, JSON.stringify(verse)); } catch {}
    } catch {
      const fallback = document.createElement('p'); fallback.textContent = 'Today’s Scripture is available through the Bible Gateway link below.';
      target.replaceChildren(fallback);
    } finally { loading = false; }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
}
