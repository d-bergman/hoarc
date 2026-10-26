# Healing of America Revival Center

The church website, built from the supplied version 9 master plan and six visual concepts. The database choice follows Darren’s October 22 instruction: **Firebase Realtime Database (RTDB)**. The original Word plan and design files on `Z:\Church Website` have not been changed.

This is a local staging build. Nothing has been deployed to Firebase, no live database rules have been changed, and no real contact email has been sent. Search indexing is disabled by default.

## Preview

Requires Node.js 22 or newer.

```powershell
cd 'C:\Users\Darren\Documents\Git Archive\hoarc'
npm ci
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. Keep the terminal running while reviewing. `npm run dev` serves the last build; run `npm run build` after source changes.

The optimized supplied images and imported biographies are in this checkout, so normal builds do not require the `Z:` drive. To deliberately regenerate them from the originals:

```powershell
node scripts/prepare-assets.mjs
```

The one-time biography importer is `scripts/extract-plan.py`. It reads the supplied DOCX without modifying it. Do not reimport routinely: that would replace editorial changes in `src/data/people.json`.

## Included

- Home, Service, About, Resources, Contact, and FAQ, with six-page navigation.
- White sticky navigation, muted supplied logo, warm ivory backgrounds, burgundy buttons, restrained gold accents, and the supplied hero images.
- November 29, 2026, 10 a.m. America/Chicago countdown, switching to an evergreen Sunday invitation at the deadline.
- All five complete supplied biographies in Bootstrap 5.3.2 modals, plus standalone biography pages for JavaScript-disabled access.
- Four supplied book covers, author names and Amazon links; Polaris Frequency channel card.
- Private announcement administration at `/admin/`, with preview-before-save, publication dates, expiration, priority, audit records, and stale-edit protection.
- RTDB rules and server functions; scheduled publication and cleanup.
- A contact form implementation with validation, consent, private server-side email, authenticated From, visitor Reply-To, rate limiting, and honeypot protection. Direct email/phone fallback is active until delivery is configured.
- Privacy, accessibility, site map, and not-found pages. Responsive images, fixed image dimensions, lazy loading below the fold, reduced-motion support, and back-to-top links.
- Per-page metadata, conditional canonicals/social image URLs, structured data, sitemap generation, and staging noindex controls.

Bootstrap is pinned to **5.3.2**, as required. Fonts use local system stacks and Georgia; there are no downloaded webfonts, stock portraits, external photo requests, analytics, or embedded social feeds.

## Editing

| File | Purpose |
| --- | --- |
| `src/templates.mjs` | Shared templates and page sections |
| `src/site.css` | Brand styling and responsive details |
| `src/data/people.json` | Complete introductions and biographies |
| `src/data/content.mjs` | Books, faith article headings, FAQs |
| `src/config.mjs` | Supplied Firebase web config and church details |
| `site.settings.json` | Launch, domain and feature switches |
| `functions/index.mjs` | Protected announcement functions and contact backend |
| `database.rules.json` | RTDB authorization |

Custom classes use single-hyphen kebab-case. CSS variables retain their required `--` prefix. Primary content is generated into HTML during the build; it does not depend on Firebase loading or visitors opening dialogs.

## Firebase setup still needed

Use project `hoarc-a5afd`; do not create or enable a separate document database.

1. Enable Email/Password in Firebase Authentication. Create the chosen administrator account in the Firebase console. No public registration UI is included.
2. Grant that UID the `admin: true` custom claim using trusted Admin SDK credentials outside the repository:
   ```powershell
   npm --prefix functions ci
   node scripts/set-admin.mjs FIREBASE_UID grant
   ```
   The script uses Application Default Credentials. Never place a service account key in this checkout. Sign out and in again after changing claims. Use `revoke` to remove access; existing ID tokens can remain usable until expiry, so urgent revocation also requires the normal Firebase incident procedure.
3. Review and deploy the RTDB rules together with `saveAnnouncement` and `syncAnnouncements`. Deploy `contact` and its cleanup function only after the email parameters/secrets are configured. Root reads/writes stay denied. Only the public published projection is readable anonymously. Drafts/audit records require an administrator claim; all browser writes stay denied, including administrator writes. The callable server performs validation and authorization.
4. Enable the billing/services required by Cloud Functions and Cloud Scheduler before deploying them. Review the one-minute schedule and set appropriate project budget alerts. No billing changes have been made by this implementation.
5. After deploying functions/rules and verifying the real administrator workflow, set `announcementsEnabled` to `true` and rebuild.

### RTDB layout

```text
announcementState/
  records/{id}       private originals, including drafts and future notices
  published/{id}     public active notices; excludes administrator metadata
  audit/{id}         private changes, retaining the latest 500 events
contactRateLimits/
  {keyedHash}        temporary request counts, no visitor message contents
```

Server transactions update records, audit and public projection together. The scheduled function recalculates active announcements every minute. A newly scheduled announcement can appear up to approximately one minute after its publication time. The browser hides expired notices within one second using the Firebase server-time offset; the scheduler removes expired public records on its next run. Previously published text is not confidential after expiration. Drafts and future scheduled text are never put in the public projection.

There is a cap of 50 stored announcement records. Old records can be archived by a trusted operator when needed; this first version offers editing and unpublishing rather than irreversible deletion.

### Contact email

The email provider has **not** been chosen. The included Nodemailer adapter supports an approved SMTP service using TLS on port 465 or 587. Confirm the provider, sender identity, quotas, costs, and retention policy before enabling it.

Set these Firebase function parameters/secrets through the Firebase CLI/console, never in browser code:

| Name | Kind | Value |
| --- | --- | --- |
| `CONTACT_ENABLED` | Boolean parameter | `false` until delivery is tested |
| `ALLOWED_ORIGINS` | String parameter | Comma-separated exact approved HTTPS origins |
| `SMTP_CONFIG` | Secret JSON | `host`, `port`, `user`, `pass`, `from` |
| `CONTACT_HASH_KEY` | Secret | Long independently generated random value |

Use an authenticated church-controlled address in `from`. The server always sends to `hoarc.church@gmail.com` and places the visitor’s validated email in Reply-To. It sends plain-text mail and does not save a duplicate contact message in RTDB. Five validated submissions per IP-derived keyed hash per 15 minutes are allowed. Expired counters are removed daily; no raw IP is saved by this application logic. Hosting/function infrastructure can retain its own operational logs.

Hosting rewrites `/api/contact` to the function. Before setting `contactEnabled: true` in `site.settings.json`, send a test through the deployed endpoint, confirm actual receipt and spam handling in Gmail, press Reply and check the visitor’s address, then complete a reply round trip. A successful website response means the sending service accepted the mail; it does not prove inbox placement. If the endpoint is unavailable, the page provides direct email/phone alternatives.

## Launch settings

`site.settings.json` currently has `publicLaunch: false`, an empty final domain, and disabled remote feature switches. This avoids inventing a canonical domain or exposing an unfinished contact form. The default local preview makes no Firebase requests on public pages. Opening `/admin/` does initialize the supplied project’s authentication client; no writes occur without a signed-in authorized administrator and deployed server functions.

When launch is approved, set the actual HTTPS `siteUrl`, finish the items in `docs/LAUNCH-CHECKLIST.md`, set the appropriate feature switches, rebuild and review. `publicLaunch: true` requires an HTTPS domain. Canonical URLs, Open Graph image URLs, WebSite/Organization/page schema, and the XML sitemap are generated from that domain. Admin pages remain noindex. An emulator build cannot be marked public.

Firebase Hosting configuration is prepared in `firebase.json`; deployment has not been performed. Use explicit deploy targets when ready. Deploying rules/functions affects the live project and should follow the completed review.

## Checks

```powershell
npm run check
npx playwright install chromium webkit
npm run dev
```

In a second terminal:

```powershell
npm run test:browser
node scripts/cross-browser-check.mjs
```

The rules and full emulator checks require Java 21+ and the function dependencies:

```powershell
npm --prefix functions ci
npm run test:rules
npm run test:integration
```

`test:integration` creates only ignored emulator configuration with dummy secrets, runs with the `demo-hoarc` project, and restores the standard staging build afterwards. No live Firebase records or real email are used. Keep the local preview server running for the browser portion. See `docs/VERIFICATION.md` for the checks actually completed and their limits.

## Content awaiting confirmation

The supplied plan explicitly leaves rights and editorial approvals open. Portraits, hero images and book covers are included for local review; their presence is not a permission record. Exact venue entrance/room and accessible route still need confirmation. The public library’s venue photo and Google Maps screenshots have not been copied. Directions use the official Maps URL instead.

The About page lists the 13 faith article headings and links to the official full statement; it does not silently rewrite doctrine or republish the full external text before approval. The Scripture section links to the official daily verse and the featured Zephaniah passage; exact CEV quotations and the daily embed remain pending translation/widget permission review. Book descriptions remain omitted until the authors approve the wording. See the launch checklist and asset register.
