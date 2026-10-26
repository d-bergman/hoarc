# Launch review

As of October 22, 2026, the website is built locally for review. The original plan remains unchanged; RTDB replaces its earlier database references by direct user instruction.

## Owner decisions

- Confirm the final domain and Firebase Hosting choice.
- Choose the initial administrator account(s) and grant custom claims.
- Enable Email/Password Authentication; verify the actual admin sign-in and password recovery process.
- Choose and approve an email delivery provider, sending identity, expected costs and retention practices.
- Review the proposed privacy/accessibility wording against the services actually enabled.
- Confirm publication permission for every supplied asset, portrait subject, and biography. Approve exact personal-history and credential wording, including Larry’s currently flagged naturopathy credentials.
- Confirm the independent ministry name: the supplied biographies say Polaris Frequency Studio; the Resources channel is Polaris Frequency. Both are preserved as supplied.
- Approve book summaries; supplied cover assets are present but rights confirmation remains open in the plan.
- Approve transfer of the full 13 Articles of Faith from the official Aquila source. The current page offers the complete external statement by link.
- Confirm CEV passage quotation rights, required attribution, and the chosen Bible Gateway daily widget/feed terms. The current site offers links without republishing passages.
- Confirm the specific first-floor room, entrance, parking directions, and accessible route/restrooms on-site. Contact mockup’s `15 N. Main St.` is not used; the plan’s `2 S Main St` is used consistently.

## Deployment and real-service checks

- Confirm billing/services required by Functions and Scheduler; review schedule frequency and set budget alerts.
- Deploy the proposed RTDB rules and functions, with correct database instance selection and appropriate IAM for the runtime service account. Confirm read/write behavior against the real project.
- Confirm only custom-claim administrators can save announcements. Test a draft, active notice, scheduled publication, expiry, unpublish, stale edit, offline/error state, and admin sign-out in the real browser.
- Set authenticated SMTP secrets and exact allowed origins. Configure sender-domain SPF/DKIM/DMARC if applicable to the chosen service.
- Test real contact receipt in `hoarc.church@gmail.com`, spam folder behavior, Gmail Reply-To, and an actual reply round trip. Test unavailable mail service and submit error behavior before enabling the public form.
- Enable announcements/contact switches only after those checks; rebuild.
- Update the static HTML metadata, canonical/social URLs, schema, robots.txt and sitemap.xml for the approved HTTPS domain; inspect the resulting public URLs.
- Verify supplied social/Amazon/PayPal destinations and the PayPal recipient before launch.
- Validate with NVDA + Chrome and VoiceOver + Safari. Test actual Android and iOS devices, text enlargement, reduced motion, touch targets, keyboard focus, and sticky-header offsets. Automated checks are not a substitute for these.
- Measure mobile Core Web Vitals on deployed Hosting; check HTTPS/security headers and CSP with actual Firebase services.
- Verify Search Console and Bing Webmaster Tools, sitemap and indexing after publication.
- Rebuild/review at launch so date-specific initial HTML remains appropriate. The client countdown automatically becomes evergreen on November 29 at 10 a.m. Central.

## Deliberately deferred

Events and Sermons & Media pages, childcare programs, dedicated prayer requests, testimonials, a full CMS, analytics, and automatic social/video/map embeds are not part of this launch build.
