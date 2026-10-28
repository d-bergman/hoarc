# October 28 V2 changes

Read the complete supplied Website Changes V2 document and applied its footer layout on all 17 pages, including relative internal links on biography pages. The invalid Bootstrap `flex-direction-column` class in the supplied snippet was replaced with a wrapping flex row so the links fit narrow screens. Copyright remains dynamic.

Moved each existing invitation directly before the footer and extended both mountain layers beyond the right edge of their SVG viewport. Navbar logo height is now 100% at desktop and mobile breakpoints. The Services page uses responsive WebP copies of `Z:/Church Website/Hero Images/services-hero-new.png`; regular builds do not need the NAS.

Live diagnosis found that Bible Gateway's CEV endpoint returned an empty response for October 28, while NIV returned the current daily passage. CEV remains preferred; an empty, failed or stale-date response now triggers a labeled NIV request. The read button follows the displayed reference and translation. Only current Central-time dates are accepted, requests include cache separation, and the current verse is revalidated hourly and after a day change. The external daily reading link remains available if both translations fail. Provider attribution is retained, following the [official integration guidance](https://www.biblegateway.com/usage/).

Verified with `npm run check`, requested-change regression tests, browser accessibility checks, Chromium/WebKit responsive checks, and an unmocked live daily verse check. Regressions include Central midnight rollover, cached reloads, empty CEV recovery, stale-date rejection and total provider failure. Live October 28 result: 1 Peter 1:24–25, NIV.

No Firebase deployment or live database changes were made.
