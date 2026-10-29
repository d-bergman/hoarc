# Changelog

## 0.4.0 — October 29, 2026

- Applied the V3 replacement logo and homepage hero from the NAS; refreshed social artwork.
- Added a static Events archive with six historical recordings, genuine locally optimized YouTube thumbnails, accessible links and newest-first ordering.
- Added Events to primary navigation and replaced the footer visit link with FAQ on all 18 pages; preserved the FAQ page and contextual links.
- Matched Service/About hero sizes across responsive breakpoints while retaining the existing page treatment.
- Added Events metadata, CollectionPage/ItemList, default Firebase canonical/sitemap entry, thumbnail maintenance helper and a documented seventh-card workflow.
- Extended accessibility, responsive, no-JavaScript and shared-navigation verification to cover Events.

## 0.3.1 — October 28, 2026

- Applied the V2 footer layout across all 17 pages and moved invitations directly above the footer.
- Extended both mountain layers across the full invitation width and set navbar logo height to 100% at all breakpoints.
- Used the supplied new Services hero image from the NAS, with responsive optimized copies.
- Fixed empty daily CEV responses by trying the current NIV verse, accurately labeling its translation and updating the read link. Added daily cache separation, hourly revalidation, and regression coverage for rollover, empty responses and stale dates.

## 0.3.0 — October 27, 2026

- Replaced the horizontal logo with the supplied October 27 image and refreshed the social artwork.
- Applied the Website Changes document sitewide: larger navigation/eyebrows, accessible hover/focus borders, simpler full-size footer text, gold social icons and utility separators, dynamic copyright year, and a circular scrolling back-to-top control.
- Self-hosted Noto Sans and Noto Serif with their SIL Open Font License notices.
- Moved the first service and countdown to December 6, 2026 at 10 am Central and standardized service times to 10 am – 12 pm.
- Removed invitation sections from About, Resources and FAQ; integrated the remaining invitations into the footer with a subtle mountain background.
- Added live daily CEV Scripture through Bible Gateway’s official endpoint, with attribution, Central-time daily refresh, same-day caching and an external-link fallback.
- Added the complete local Statement of Faith, including vision and wholistic-health sections, linked only from About, and applied the requested FAQ answers.

## 0.2.0 — October 26, 2026

- Replaced generated page templates with 16 tracked, formatted HTML source files, including all six primary pages in the repository root.
- Moved CSS, images, licenses and ready-to-serve JavaScript into tracked `assets/`; a fresh checkout previews without installing or building.
- Changed navigation and assets to relative paths and explicit HTML filenames, including standalone biographies.
- Removed the page generator. The optional build now packages source HTML unchanged and bundles JavaScript only.
- Updated the preview server, Firebase routing, tests, version and documentation for the conventional static layout.

## 0.1.0 — October 22, 2026

- Created the six-page church website from the supplied plan and design concepts.
- Integrated the supplied logo, six heroes, five portraits and four book covers as optimized local assets.
- Preserved all five complete biographies and provided accessible modal/profile navigation.
- Added first-service countdown and evergreen deadline behavior.
- Implemented Firebase Authentication/RTDB announcement administration, protected callable saves, publication/expiry, audit and stale-edit checks.
- Implemented the private contact email backend and accessible form; retained direct email/phone fallback pending real provider setup.
- Added Hosting/security configuration, metadata generation, privacy/accessibility pages, sitemap, noindex staging, tests, and launch documentation.
- No deployment, live database change, or real email delivery performed.
