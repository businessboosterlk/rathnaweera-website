// Turns the handoff's PNG masters (1.3 to 2 MB each) into trimmed WebP masters the site commits, and makes the
// favicon, apple touch icon and share image from the REPAIRED seal. Astro's <Picture> makes the AVIF and WebP
// sizes from these masters at build time. Run on the Mac that holds the handoff; CI only uses the committed output.
//   node scripts/prep-images.mjs [handoff folder] [repaired seal]
// THE SEAL RULE: only the seal repaired on 4 Nov 2026 is allowed. The seal inside the handoff (seal-original.png
// and approved-storyboard/assets/seal.png) is the version from before the repair. This script refuses it by its hash.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HANDOFF = process.argv[2] || join(homedir(), 'Downloads/RATHNAWEERA-WEBSITE/handoff-clear-assurance/rathnaweera-handoff');
const SEAL = process.argv[3] || join(homedir(), 'Downloads/RATHNAWEERA-BRAND/Rathnaweera-Logo.png');
export const OLD_SEAL_SHA256 = 'e1352e0c6c3894bd96ac30ed451fdc2dd4888b4f4a67534d8791b9af6b25d2fa';
export const REPAIRED_SEAL_SHA256 = '5f05315b7d4c67bcbcc4f37ee7e5a906f5fff3378360d7cbbfcc18b8d4880e4e';

const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex');
const sealHash = sha(SEAL);
if (sealHash === OLD_SEAL_SHA256) { console.error('REFUSED  ' + SEAL + ' is the seal from before the 4 Nov repair.'); process.exit(1); }
if (sealHash !== REPAIRED_SEAL_SHA256) { console.error('REFUSED  ' + SEAL + ' is not the repaired seal (hash ' + sealHash.slice(0, 12) + '). If the seal was repaired again, update REPAIRED_SEAL_SHA256 on purpose.'); process.exit(1); }

const OUT = 'src/assets/img', PUB = 'public';
mkdirSync(OUT, { recursive: true });
const log = [];
const done = (f, note) => { const kb = Math.round(statSync(f).size / 1024); log.push(`${f}  ${kb} KB  ${note}`); };

// Hero layers keep their alpha. Trim the empty margin so the box is the drawing.
for (const [name, width] of [['hero-globe', 1100], ['hero-plane', 640]]) {
  const f = join(OUT, name + '.webp');
  await sharp(join(HANDOFF, 'assets', name + '.png')).trim({ threshold: 1 }).resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(f);
  done(f, 'alpha, trimmed');
}
// Card scenes are opaque 4:3. 1000 px is the largest the page asks for at 2x.
for (const n of ['driver', 'kitchen', 'security', 'housekeeper', 'waiter', 'cleaner'].map(x => 'job-' + x)
  .concat(['kuwait', 'qatar', 'uae', 'saudi-arabia', 'oman', 'bahrain'].map(x => 'country-' + x))) {
  const f = join(OUT, n + '.webp');
  await sharp(join(HANDOFF, 'assets', n + '.png')).resize({ width: 1000 }).webp({ quality: 80, effort: 6 }).toFile(f);
  done(f, 'opaque 4:3');
}
// The repaired seal: page mark, favicon, apple touch icon, share image.
const seal = sharp(SEAL).trim({ threshold: 1 });
const sealBuf = await seal.png().toBuffer();
await sharp(sealBuf).resize({ width: 256 }).webp({ quality: 90, alphaQuality: 95 }).toFile(join(OUT, 'seal.webp')); done(join(OUT, 'seal.webp'), 'repaired seal');
await sharp(sealBuf).resize(64, 64, { fit: 'contain', background: '#00000000' }).png().toFile(join(PUB, 'favicon.png')); done(join(PUB, 'favicon.png'), 'favicon');
await sharp(sealBuf).resize(150, 150, { fit: 'contain', background: '#ffffff' }).extend({ top: 15, bottom: 15, left: 15, right: 15, background: '#ffffff' })
  .flatten({ background: '#ffffff' }).png().toFile(join(PUB, 'apple-touch-icon.png')); done(join(PUB, 'apple-touch-icon.png'), 'apple touch icon, white ground');
const mark = await sharp(sealBuf).resize(420, 420, { fit: 'contain', background: '#00000000' }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#ffffff' } })
  .composite([{ input: mark, top: 105, left: 390 }]).jpeg({ quality: 86 }).toFile(join(PUB, 'og.jpg')); done(join(PUB, 'og.jpg'), 'share image, seal on white');

writeFileSync(join(OUT, 'SOURCE.json'), JSON.stringify({ made_by: 'scripts/prep-images.mjs', seal_source: SEAL.replace(homedir(), '~'), seal_sha256: sealHash, handoff: HANDOFF.replace(homedir(), '~') }, null, 1) + '\n');
console.log(log.join('\n'));
