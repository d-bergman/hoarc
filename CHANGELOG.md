# Changelog

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
