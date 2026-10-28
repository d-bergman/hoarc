> October 28 V2 update: all 17 pages use the revised footer, invitations precede it, and Services uses the supplied new hero. Daily Scripture recovers from empty CEV responses with a labeled NIV verse. Static/unit, accessibility/browser, requested-change regression and Chromium/WebKit checks passed, including an unmocked current-day verse check. See [V2 changes](OCTOBER-28-CHANGES.md).

> October 27 update: 17 editable HTML pages now include the local Statement of Faith. The daily CEV endpoint was verified live; requested-change checks cover global footer/font controls, Central-midnight refresh, caching and provider failure. The service deadline is December 6 at 10 am Central.

> October 26 update: the site now uses directly editable root HTML files and tracked assets. The page generator was removed; packaging checks also verify source HTML is copied byte-for-byte. Browser and integration checks are rerun for the explicit .html routes.

# Verification record

Local verification performed October 22, 2026. The Firebase emulators used the isolated `demo-hoarc` project; the live `hoarc-a5afd` project was not mutated.

## Completed

| Check | Result |
| --- | --- |
| `npm run check` | Pass: six domain tests, packaging of 16 editable HTML pages without source changes, unique IDs, local link/image targets, complete biography preservation, database SDK bundle checks |
| `npm run test:rules` with Java 21 | Pass: anonymous published reads; denied root/private reads; admin-only draft/audit reads; denied client writes for visitors, ordinary accounts and administrators |
| `npm run test:browser` | Pass: 21 Chromium page/viewport/modal WCAG A/AA scans with no automated findings and no uncaught JavaScript errors |
| `npm run test:cross-browser` | Pass: Chromium and WebKit, all six primary pages at 320/390/768/1024/1440 CSS px, touch FAQ, modal scrolling, enlarged text |
| Functions emulator integration | Pass: missing/non-admin token rejection, valid admin save, unpublish, audit, stale edit rejection, URL validation, contact disabled/origin responses |
| Scheduled handler integration | Pass: called handlers against emulated RTDB; publication, expiry and expired rate-counter cleanup verified |
| Admin browser integration | Pass: sign in, preview, save, anonymous live notice, text escaping, expiration, preview invalidation, sign out |
| Contact browser integration | Pass with mocked HTTP responses: accessible fields, consent, success state, service error and retaining typed message; no real mail sent |
| Hosting emulator rewrite | Pass: POST to `/api/contact/` reaches the contact function and returns its disabled-service fallback without a redirect |
| JavaScript-disabled fallback | Pass: biography links open complete standalone pages; FAQ details remain interactive; mobile navigation has a no-script stylesheet |
| Countdown | Pass: exact 10 a.m. Central deadline, never negative, and evergreen invitation after deadline |
| Production dependency audit | Zero reported vulnerabilities in root production dependencies and function dependencies |

The normal `npm test` command skips the emulator-only suites unless the required emulator environment is present. Those suites were run separately; a skip in the normal command is not presented as emulator coverage.

The modal scroll regions were made keyboard focusable after automated accessibility testing. Image/card height and Bootstrap gutter issues found during review were corrected. Keyboard checks confirm modal Escape dismissal and focus return, mobile menu Escape handling, and FAQ activation.

Screenshots and machine-readable reports are saved locally under ignored `artifacts/`; they are QA outputs, not deployable site content. The source contains commands to regenerate them.

## Verification limits

- WebKit testing is not a physical iPhone/Safari/VoiceOver test. NVDA, VoiceOver, real Android/iOS devices and manual assistive-technology review remain launch checks.
- Real email provider authentication, quotas, Gmail inbox placement, spam filtering, Gmail Reply-To and a reply round trip are unverified because no delivery provider/credentials have been supplied. The live form remains disabled; direct email/phone links work.
- Custom Hosting headers are configured and statically checked, but this Windows Hosting emulator does not apply them. Its `glob-slasher` normalizes URL/header patterns with Windows backslashes, which its minimatch matcher then interprets incorrectly. Direct inspection showed the headers missing on local responses. Validate CSP, caching and admin X-Robots-Tag on deployed Hosting. Local browser results are not proof of deployed CSP compatibility.
- Scheduler handlers were invoked locally against the emulator. Actual Cloud Scheduler delivery, deployed IAM, project quotas, real RTDB permissions and administrator provisioning remain deployment checks.
- No deployed Core Web Vitals or throttled real-device performance measurements have been taken. All 29 optimized image files total approximately 2.05 MiB; images are loaded per page and responsive/lazy where appropriate.
- The full development dependency audit reports seven advisories (three high, four moderate), in Firebase CLI development tooling and its transitive watcher/telemetry/HTTP dependencies. These packages are not in the website JavaScript or the deployed function dependency tree. A patched gRPC version is explicitly pinned for the SDK tree. Do not use an automatic forced downgrade; recheck upstream CLI advisories before release tooling updates.
- Rights, credential wording, exact venue access details, final domain and editorial approvals are tracked in the launch checklist rather than assumed complete.

## References checked

- Firebase RTDB security rules: https://firebase.google.com/docs/database/security
- Firebase HTTP functions: https://firebase.google.com/docs/functions/http-events
- Firebase emulator setup: https://firebase.google.com/docs/emulator-suite/install_and_configure
- Bootstrap modal documentation: https://getbootstrap.com/docs/5.3/components/modal/
- Bible Gateway website integrations: https://www.biblegateway.com/usage/
- Official Articles of Faith reference: https://www.aquilachristian.org/beliefs--vision.html

The source plan requires Bootstrap 5.3.2; installed source is pinned to that release even though the online Bootstrap documentation describes the broader 5.3 series. No external doctrinal text or Scripture text was republished based solely on these references.
