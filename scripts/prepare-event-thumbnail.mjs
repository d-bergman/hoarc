import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Maintenance helper only. The public page uses local images, never this API.
export async function prepareEventThumbnail(id) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) throw new Error('Supply an 11-character YouTube video ID.');
  for (const variant of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const source = `https://i.ytimg.com/vi/${id}/${variant}.jpg`;
    const response = await fetch(source);
    if (!response.ok) continue;
    const image = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(image).metadata();
    if (metadata.width < 320) continue; // Reject the small missing-image placeholder, even on HTTP 200.
    await mkdir('assets/images/events', { recursive: true });
    await sharp(image).resize(640, 360, { fit: 'cover' }).webp({ quality: 84 }).toFile(`assets/images/events/${id}.webp`);
    await sharp(image).resize(400, 225, { fit: 'cover' }).webp({ quality: 82 }).toFile(`assets/images/events/${id}-small.webp`);
    console.log(`Prepared ${id}: ${source} (${metadata.width}×${metadata.height}).`);
    return;
  }
  throw new Error(`No usable YouTube thumbnail for ${id}. No placeholder was written.`);
}

if (process.argv[1]?.endsWith('prepare-event-thumbnail.mjs')) await prepareEventThumbnail(process.argv[2]);
