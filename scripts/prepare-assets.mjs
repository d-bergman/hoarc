import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export async function prepareAssets(sourceRoot = process.env.HOARC_ASSETS || 'Z:/Church Website') {
  const dest = 'assets/images';
  await mkdir(dest, { recursive: true });
  const groups = [
    ['Hero Images', 1920], ['Portraits', 720], ['Book Covers', 600], ['Logo', 1000],
  ];
  const manifest = {};
  for (const [folder, width] of groups) {
    for (const file of await readdir(path.join(sourceRoot, folder))) {
      if (!/\.(png|jpe?g)$/i.test(file)) continue;
      const id = path.parse(file).name.replace('transofrmation', 'transformation');
      let input = sharp(path.join(sourceRoot, folder, file)).rotate();
      if (folder === 'Logo') input = input.trim({ threshold: 10 });
      const out = path.join(dest, `${id}.webp`);
      const info = await input.resize({ width, withoutEnlargement: true }).webp({ quality: 85 }).toFile(out);
      manifest[id] = { width: info.width, height: info.height, src: `/assets/images/${id}.webp` };
      if (folder === 'Hero Images' || folder === 'Portraits') {
        await sharp(path.join(sourceRoot, folder, file)).rotate().resize({ width: folder === 'Hero Images' ? 900 : 360, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dest, `${id}-small.webp`));
      }
    }
  }
  await sharp(path.join(sourceRoot, 'Logo/hoarc-favicon.png')).trim({ threshold: 10 }).resize(64, 64, { fit: 'contain', background: '#ffffff00' }).png().toFile('favicon.png');
  // Original social image composition using only the supplied church assets.
  const overlay = Buffer.from('<svg width="1200" height="630"><rect y="390" width="1200" height="240" fill="#fff4df"/></svg>');
  const logo = await sharp(path.join(sourceRoot, 'Logo/hoarc-horizontal-main.png')).trim({ threshold: 10 }).resize({ width: 720, height: 180, fit: 'inside' }).png().toBuffer();
  await sharp(path.join(sourceRoot, 'Hero Images/homepage-hero.png')).resize(1200, 630, { fit: 'cover' }).composite([{ input: overlay }, { input: logo, left: 240, top: 430 }]).jpeg({ quality: 88 }).toFile('assets/images/social-share.jpg');
  await writeFile('src/data/images.json', JSON.stringify(manifest, null, 2) + '\n');
  await mkdir('assets/licenses', { recursive: true });
  await copyFile('node_modules/bootstrap/LICENSE', 'assets/licenses/bootstrap.txt');
  console.log(`Prepared ${Object.keys(manifest).length} optimized supplied assets`);
}

if (process.argv[1]?.endsWith('prepare-assets.mjs')) await prepareAssets();
