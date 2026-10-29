# October 29 V4 changes

Read the entire V4 document and the additional direct request for mutually exclusive FAQs. Applied extension-free `/hoarc` routes across all 18 pages, canonical tags, social URLs and sitemap. Direct HTTP checks of the live GitHub Pages host confirmed that `/hoarc/service`, `/hoarc/about`, `/hoarc/events`, `/hoarc/faq` and `/hoarc/about/larry` already return the correct HTML with status 200. No directory aliases, duplicate pages or new publishing workflow are needed. Original `.html` source files remain editable and accessible.

Local preview resolves the same routes, including nested biographies, while stripping the project prefix for local assets. Firebase Hosting's optional configuration supports the prefix through redirects and clean URLs for emulator compatibility; it was not deployed. In-page links include the correct page path so moving from a legacy `.html` address to a clean route does not lose the anchor.

FAQ details share the native `name` group, with a toggle fallback for older browsers. Opening another closes the preceding item, and clicking the open item can close all. Keyboard operation and exclusive behavior were checked in Chromium/WebKit with and without JavaScript.

The Contact form is visible beneath Let’s connect and includes required first name, last name and email; existing subject, message and consent are retained. Email is validated in the browser and on the server. Authenticated church Gmail remains From/To and the visitor is Reply-To. App Check verification rejects missing, invalid and other-app tokens; a honeypot, input bounds, origin restriction, private hashed-IP quotas and safe failure handling add further protections. The lazy App Check module loads only when enabled messaging is submitted. No SMTP credentials belong in frontend settings.

The owner selected church Gmail with Firebase. Live delivery cannot be enabled until the app password, App Check registration/site key and backend deployment are supplied. `scripts/configure-gmail.ps1` securely prompts locally and stores secrets only when explicitly run. See [contact setup](CONTACT-SETUP.md). No real email, live Firebase record/rule change or Firebase deployment was performed.

The requested Events paragraph was removed. The six recordings, dates, titles, thumbnails and links remain intact. Verification includes static/unit checks, browser/accessibility checks, Chromium/WebKit responsiveness, V4-specific clean-route/FAQ checks and isolated Firebase emulator integration.
