# Maintaining the Events archive

The public archive is ordinary source HTML in `events.html`. Its six cards are available without JavaScript. No CMS, database, player embeds or rendering framework is needed. The default canonical/social origin is the configured Firebase project’s `https://hoarc-a5afd.web.app`; replace this origin in the Events metadata, structured data and `sitemap.xml` when the custom domain is approved. The existing staging `noindex,nofollow` policy remains in place.

## Add a seventh recording

1. Open `events.html` and locate `<div class="row g-4" data-recordings>`. Copy one complete child `<div class="col-md-6 col-lg-4">…</div>` and insert it first if the recording is newest. Otherwise insert it by descending event date.
2. Replace the video ID in the card’s image `src`, both `srcset` paths, title `id`, article `aria-labelledby` and YouTube link. Use the actual ID after `/live/` or `watch?v=`. Replace the visible date and `<time datetime="YYYY-MM-DD">`, H3 title, description and hidden descriptive link title. Use the gathering date, not an assumed upload date. Escape ampersands as `&amp;` in HTML.
3. From the checkout, after `npm ci` if dependencies are absent, run `node scripts/prepare-event-thumbnail.mjs VIDEO_ID`. It retrieves the actual YouTube thumbnail, tries max-resolution, standard and high-quality versions in order, rejects missing-image placeholders, and writes local 640×360 and 400×225 WebP files. Confirm the thumbnail belongs to that recording. If no thumbnail is available, the command fails without writing a placeholder; obtain the correct image before publishing the card.
4. Keep the existing dimensions, lazy loading, responsive sizes, card classes, accessible play icon and new-tab label. The thumbnail is decorative because the H3 and recording link describe the event. Do not add an iframe or autoplay.
5. In the page’s `application/ld+json` block, add the matching ItemList entry in the same order, renumber `position` values and change `numberOfItems` from 6 to 7. Do not invent VideoObject upload dates, duration, credentials or upcoming Event information.
6. Update the expected video IDs/card count in `scripts/events-check.mjs` to include the seventh recording. Run `npm run check`, preview with `npm run dev`, then run `npm run test:events`. Check the new link, date, thumbnail, keyboard focus and mobile layout before committing.

The supplied initial archive is dated September 27, May 17 and March 29, 2026, followed by September 28, July 27 and May 18, 2025. Its descriptions and historical identity come from the owner’s V3 document. All six IDs were checked against YouTube’s oEmbed responses; the channel is New Eden. Original video metadata and selected thumbnail URLs from that check are recorded in the ignored local verification artifact, not used as runtime dependencies.

## Add upcoming events later

When confirmed information exists, insert a separate semantic section above the archive with an H2, dates, times, venue details and links. Keep past recordings in their current archive. Do not show an empty section, invented event or placeholder announcement. Add Event structured data only for actual scheduled events with verified details.

## Shared layout and assets

The header/footer are editable markup repeated on every HTML page. Keep the Events navigation item and FAQ footer link consistent across root and `about/` pages; biography pages use `../` links. Events has the active navigation state only on `events.html`. FAQ keeps its URL, metadata and contextual links.

Supplied NAS assets used by V3: `Logo/hoarc-horizontal-main-new.png`, `Hero Images/homepage-hero-new.png` and `Hero Images/events-hero.png`. The document’s logo spelling differed; this is the matching new file actually present. The original replacement logo is retained locally, and hero/logo derivatives are committed. Normal builds need no NAS connection. The existing asset-preparation script now retains these selections during regeneration. Thumbnails are maintained independently with the helper above.
