# October 27 requested changes

Implemented from the supplied `Website Changes.docx` and replacement horizontal PNG. The source document was read, including its embedded mountain-footer reference; it was not modified. The website remains directly editable HTML with the existing RTDB backend.

- Replaced the navbar logo on every page, retained the supplied original PNG, and refreshed the derived WebP and social image.
- Set navigation links to 1.25rem and added a visible bottom border on hover and keyboard focus.
- Removed the footer’s About/Resources/FAQ links and its left-column service information. Removed all footer `small` classes/elements. Copyright uses the current browser year at runtime, with no year hardcoded in footer HTML.
- Added gold backgrounds/burgundy symbols and accessible hover/focus states to social links. Gold vertical separators divide Privacy Policy, Accessibility and Site Map.
- Replaced the full-width back-to-top strip with an accessible circular control at the bottom right, shown after scrolling and hidden at the top.
- Downloaded Noto Sans and Noto Serif normal/italic Latin variable fonts from Google Fonts. They are served locally; SIL Open Font License notices are retained in `assets/licenses/notosans-OFL.txt` and `notoserif-OFL.txt`.
- Raised eyebrow text to 0.9rem. Removed the `ms-2` arrow spacing from ordinary text links and changed their decoration to a same-color solid bottom border that becomes dotted on hover/focus, including the featured Scripture reference.
- Moved the first service to Sunday, December 6, 2026 at 10 am Central, including the countdown configuration, visible dates, FAQ and regression tests. Service times use `10 am – 12 pm`.
- Removed invitations from About, Resources and FAQ. The Home, Service and Contact invitations now belong to their footer and use original subtle vector mountain silhouettes.
- Added the live daily CEV passage above the homepage button, with Bible Gateway attribution. Removed the requested sentence below the button.
- Created `statement-of-faith.html`, linked from About only, outside the navigation/footer. The source’s complete Articles of Faith, vision and wholistic-health wording was preserved; extraneous source-site presentation markup was removed. A text comparison against the retrieved source confirmed no wording was lost.
- Applied the exact requested parking/accessibility FAQ answers.

The daily verse uses Bible Gateway’s official JSONP service at `https://www.biblegateway.com/votd/get/` because that endpoint does not permit cross-origin JSON fetches. It requires no API key or Firebase function. The code renders provider text safely, caches only the current Central-time day, refreshes after midnight/returning to the tab, retains required provider attribution, and leaves the external read button usable if the provider is unavailable. The prepared CSP allows only that provider script path in addition to local scripts. Actual deployed CSP verification remains necessary because the Windows Hosting emulator omits custom headers.

Live verification on October 27 returned the CEV daily passage, Hebrews 4:12, and displayed it on the homepage. Fixtures separately verified Central-midnight rollover, same-day caching and failure fallback; fixture content is confined to the browser test and never saved into public HTML.

Checks: `npm run check`, `npm run test:browser`, `npm run test:cross-browser`, `npm run test:changes`, and local Firebase integration. The new page also received an automated WCAG A/AA scan. No live Firebase rules, users, records, email or deployment were changed.

References: [Bible Gateway integration options](https://www.biblegateway.com/usage/), [official CEV widget generator](https://www.biblegateway.com/usage/votd/custom_votd/?version=CEV), [official ministry statement](https://www.aquilachristian.org/beliefs--vision.html), [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans), [Noto Serif](https://fonts.google.com/noto/specimen/Noto+Serif).
