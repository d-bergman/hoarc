# Healing of America Revival Center

This is a conventional static website. **The HTML pages are directly editable files in the repository root.** No template engine, page generator, or build is needed to view or edit the website.

| Page | File |
| --- | --- |
| Home | [index.html](index.html) |
| Service | [service.html](service.html) |
| About | [about.html](about.html) |
| Resources | [resources.html](resources.html) |
| Contact | [contact.html](contact.html) |
| FAQ | [faq.html](faq.html) |
| Announcement administrator | [admin.html](admin.html) |
| Privacy and accessibility | [privacy.html](privacy.html), [accessibility.html](accessibility.html) |
| Events and recordings | [events.html](events.html) |
| Site map and not found | [sitemap.html](sitemap.html), [404.html](404.html) |
| Individual biographies | [about/](about/) |

The design follows the supplied church plan and concepts. Firebase **Realtime Database (RTDB)** is the database. The original Word plan and images on the `Z:` drive have not been modified.

## Edit and preview

Edit page content in the HTML files. Edit the theme in [assets/site.css](assets/site.css). Images are in [assets/images/](assets/images/), and ready-to-serve JavaScript is in `assets/`. Page links and assets use relative paths, so the website also works beneath a static host's subdirectory.

Serve this folder with any static web server, VS Code Live Server, or the included Node server:

```powershell
cd 'C:\Users\Darren\Documents\Git Archive\hoarc'
npm run dev
```

Open `http://127.0.0.1:4173`. **There is no install or build step for previewing the committed website.** Reload after editing HTML/CSS. Use an HTTP server for JavaScript modules rather than opening pages with `file://`.

Shared navigation and footer markup is present in each HTML page. If changing it, apply the change to all pages, including the biography pages. Full biographies appear in the About modals and their individual pages; keep those copies consistent.

## JavaScript and optional deployment packaging

`assets/site.js`, `assets/admin.js`, and their adjacent dependency chunks are committed so a fresh checkout can serve immediately. Bootstrap remains pinned to 5.3.2. Readable JavaScript module sources live in `src/`; Firebase server functions live separately in `functions/`.

When changing JavaScript sources or the runtime feature switches in `site.settings.json`:

```powershell
npm ci
npm run build
```

This bundles JavaScript into `assets/` and copies the existing HTML, CSS, images, and scripts into ignored `dist/` for Firebase Hosting. **It never regenerates or overwrites the source HTML or CSS.** Commit updated JavaScript assets with their source changes. Ordinary HTML/CSS edits require only a refresh; run the packaging command before deploying to Firebase.

Metadata, canonical/social URLs, robots directives and the sitemap are now editable static files as well. They are deliberately set for staging, with no indexing. Events uses the configured project's default Firebase Hosting origin in its canonical/social URLs and sitemap entry. Before launch, update metadata and the full sitemap for the approved domain. `site.settings.json` controls announcements and contact-form availability; it does not rewrite page content or indexing settings.

The Events archive uses semantic HTML cards and local thumbnails. See [Events maintenance](docs/EVENTS.md) for the exact process to add a seventh recording or a future upcoming-events section.

## Firebase

Project: `hoarc-a5afd`. The supplied public web configuration is in `src/config.mjs`. No live Firebase deployment or database-rule change has been made by this repository's implementation.

- Enable Email/Password Authentication, create the approved administrator account, and grant its UID the `admin: true` custom claim using trusted Application Default Credentials:
  ```powershell
  npm --prefix functions ci
  node scripts/set-admin.mjs FIREBASE_UID grant
  ```
  Use `revoke` to remove the claim. Sign out/in after changing claims; existing ID tokens can remain usable until expiry. Never put an Admin SDK/service account key in the repository.
- Review/deploy `database.rules.json`, `saveAnnouncement`, and `syncAnnouncements`. Root access stays denied. Only the published projection is public. Draft/audit reads require an administrator claim; all browser writes stay denied, including administrator writes. Validated changes use the protected callable function.
- The admin page is `admin.html`. It requires preview before saving, supports schedules/unpublishing, and rejects stale edits.
- RTDB holds private originals at `announcementState/records`, public notices at `announcementState/published`, and the latest 500 private audit events at `announcementState/audit`.
- Scheduler publication can take up to approximately one minute. The browser hides expired notices within one second using the server-time offset; the scheduler removes expired public records on its next run. Previously published text is not confidential after expiry.
- There is a cap of 50 stored announcements; trusted operators can archive old records when needed.
- Functions/Scheduler require their corresponding billing/services. No billing changes have been made.
- After the real setup is verified, enable `announcementsEnabled` in `site.settings.json` and rebuild JavaScript assets.

## Contact form

The contact form is ordinary HTML in `contact.html`. It is hidden by default while direct email/phone links remain visible. When `contactEnabled` is enabled and JavaScript assets are rebuilt, the form becomes available. Without JavaScript, direct contact links remain usable.

The SMTP provider/sending identity is still to be selected and approved. The included server adapter uses authenticated TLS SMTP, sends only to `hoarc.church@gmail.com`, and sets the visitor's validated email as Reply-To. It does not save a duplicate message in RTDB.

| Function setting | Kind | Value |
| --- | --- | --- |
| `CONTACT_ENABLED` | Boolean parameter | Keep false until tested |
| `ALLOWED_ORIGINS` | String parameter | Exact approved origins, comma separated |
| `SMTP_CONFIG` | Secret JSON | `host`, `port` (465 or 587), `user`, `pass`, `from` |
| `CONTACT_HASH_KEY` | Secret | Independently generated random value |

Configure these through Firebase, not browser code. Deploy `contact` and its cleanup function after configuration. Firebase Hosting rewrites `/api/contact/` to the function. Other static hosts need an appropriate backend URL/rewrite before the form is enabled.

The backend validates lengths, email and consent, rejects header injection, uses a honeypot and limits five validated submissions per IP-derived keyed hash per 15 minutes. Expired counters are cleaned daily; no raw IP or contact message is stored by this application logic. Infrastructure can keep its own operational logs.

Verify a real test reaches the church Gmail inbox, check spam handling, click Reply and confirm the visitor's address, and complete a reply round trip. A successful form response means the sending service accepted the mail; inbox placement remains a separate check.

## Checks

Developer tooling requires Node 22+ and `npm ci`:

```powershell
npm run check
npx playwright install chromium webkit
npm run dev
```

With the preview server running:

```powershell
npm run test:browser
npm run test:cross-browser
```

With Java 21+ and function dependencies installed:

```powershell
npm --prefix functions ci
npm run test:rules
npm run test:integration
```

Integration checks launch their own disposable preview on port 4174 and use the isolated `demo-hoarc` Firebase emulators. Test feature switches affect only ignored `dist/`; committed HTML and runtime assets stay unchanged. No real email is sent.

See [verification](docs/VERIFICATION.md), [launch checklist](docs/LAUNCH-CHECKLIST.md), and [asset register](docs/ASSET-REGISTER.md) for results, remaining approvals, and live-service limits. Portrait/cover rights and exact venue access remain launch decisions. The owner-requested Statement of Faith is in statement-of-faith.html and linked only from About. The homepage requests daily CEV Scripture using Bible Gateway’s official endpoint, with a labeled NIV fallback when CEV is unavailable, attribution, Central-time refresh, hourly revalidation and an external read link. Noto fonts are served locally with their licenses. The first service is December 6, 2026 at 10 am Central.

The daily-verse service uses the provider’s official JSONP endpoint because it does not allow cross-origin JSON fetches. Only the fixed Bible Gateway endpoint is permitted by the prepared script CSP; provider text is rendered as plain text. No API key or Firebase deployment is needed for this feature.
