// Turns the handoff's PNG masters (1.3 to 2 MB each) into trimmed WebP masters the site commits, and makes the
// favicon, apple touch icon and share image from the REPAIRED seal. Astro's <Picture> makes the AVIF and WebP
// sizes from these masters at build time. Run on the Mac that holds the handoff; CI only uses the committed output.
//   node scripts/prep-images.mjs [handoff folder] [repaired seal]
// THE SEAL RULE: only the seal repaired on 4 Nov 2026 is allowed. The seal inside the handoff (seal-original.png
// and approved-storyboard/assets/seal.png) is the version from before the repair. This script refuses it by its hash.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const HANDOFF = ARGS[0] || join(homedir(), 'Downloads/RATHNAWEERA-WEBSITE/handoff-clear-assurance/rathnaweera-handoff');
const SEAL = ARGS[1] || join(homedir(), 'Downloads/RATHNAWEERA-BRAND/Rathnaweera-Logo.png');
export const OLD_SEAL_SHA256 = 'e1352e0c6c3894bd96ac30ed451fdc2dd4888b4f4a67534d8791b9af6b25d2fa';
export const REPAIRED_SEAL_SHA256 = '5f05315b7d4c67bcbcc4f37ee7e5a906f5fff3378360d7cbbfcc18b8d4880e4e';

// `--scenes-only` remakes the pictures and leaves every seal file exactly as committed. It is for the day the brand
// folder's logo has changed and nobody has yet said the site should follow: the seal check below still refuses.
const SCENES_ONLY = process.argv.includes('--scenes-only');
const sha = f => createHash('sha256').update(readFileSync(f)).digest('hex');
const sealHash = SCENES_ONLY ? REPAIRED_SEAL_SHA256 : sha(SEAL);
if (sealHash === OLD_SEAL_SHA256) { console.error('REFUSED  ' + SEAL + ' is the seal from before the 4 Nov repair.'); process.exit(1); }
if (sealHash !== REPAIRED_SEAL_SHA256) { console.error('REFUSED  ' + SEAL + ' is not the repaired seal (hash ' + sealHash.slice(0, 12) + '). If the seal was repaired again, update REPAIRED_SEAL_SHA256 on purpose.'); process.exit(1); }

const OUT = 'src/assets/img', PUB = 'public';
mkdirSync(OUT, { recursive: true });
const log = [];
const done = (f, note) => { const kb = Math.round(statSync(f).size / 1024); log.push(`${f}  ${kb} KB  ${note}`); };

// NEW PICTURES DROP IN BY NAME (5 Nov 2026). A PNG in ~/Downloads/RATHNAWEERA-WEBSITE/new-images wins over the
// handoff's stand-in of the same name. A name with no file anywhere is skipped and the page draws its quiet
// stand-in panel (src/components/Shot.astro). Real photos of the agency come from real-photos as real-<name>.webp.
const NEW = process.env.NEW_IMAGES || join(homedir(), 'Downloads/RATHNAWEERA-WEBSITE/new-images');
const REAL = process.env.REAL_PHOTOS || join(homedir(), 'Downloads/RATHNAWEERA-WEBSITE/real-photos');
const pick = (name, dirs, exts = ['png', 'jpg', 'jpeg', 'webp']) => { for (const d of dirs) for (const e of exts) { const f = join(d, name + '.' + e); if (existsSync(f)) return f; } return null; };
const used = [];
// Hero plane keeps its alpha. Trim the empty margin so the box is the drawing. (The globe is drawn from map data.)
for (const [name, width] of [['hero-globe', 1100], ['hero-plane', 640]]) {
  const src = pick(name, [NEW, join(HANDOFF, 'assets')]); if (!src) continue;
  const f = join(OUT, name + '.webp');
  await sharp(src).trim({ threshold: 1 }).resize({ width, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 90, effort: 6 }).toFile(f);
  done(f, 'alpha, trimmed, from ' + (src.startsWith(NEW) ? 'new-images' : 'handoff')); used.push(name);
}
// Scenes are opaque and cut to 4:3 (ChatGPT gives 3:2, the handoff gave 4:3). 1000 px is the largest the page asks for at 2x.
const SCENES = ['driver', 'kitchen', 'security', 'housekeeper', 'waiter', 'cleaner'].map(x => 'job-' + x)
  .concat(['kuwait', 'qatar', 'uae', 'saudi-arabia', 'oman', 'bahrain'].map(x => 'country-' + x))
  .concat(['step-1-registered', 'step-2-medical', 'step-3-training', 'step-4-job-offer', 'step-5-agreement', 'step-6-visa', 'step-7-sent-abroad'])
  .concat(['safety-receipt', 'guide-documents', 'guide-legal-steps', 'guide-videos']);
// CUTS (5 Nov 2026). Nine of the ChatGPT pictures came as a square scene padded out to 3:2 with a blurred copy of
// itself down both sides (top and bottom on the upright one). The band is not part of the picture, so each is cut to
// its clean middle, measured by sharpness per 16 px strip: [left, top, width, height] in the source's own pixels.
// A picture with no line is cut to the middle as before. When a picture is remade without bands, delete its line.
const CUT = {
  'job-cleaner': [288, 60, 928, 696], 'safety-receipt': [288, 188, 928, 696], 'guide-documents': [288, 120, 928, 696],
  'guide-legal-steps': [288, 160, 952, 714], 'guide-videos': [288, 100, 928, 696], 'country-bahrain': [240, 0, 1040, 780],
  'step-2-medical': [240, 110, 1040, 780], 'step-3-training': [176, 120, 1168, 876], 'apply-callback': [111, 368, 618, 928],
};
const cut = (src, n) => { const c = CUT[n], s = sharp(src); return c && src.startsWith(NEW) ? s.extract({ left: c[0], top: c[1], width: c[2], height: c[3] }) : s; };
for (const n of SCENES) {
  const src = pick(n, [NEW, join(HANDOFF, 'assets')]); if (!src) continue;
  const f = join(OUT, n + '.webp');
  await cut(src, n).resize({ width: 1000, height: 750, fit: 'cover' }).webp({ quality: 80, effort: 6 }).toFile(f);
  done(f, 'opaque 4:3, from ' + (src.startsWith(NEW) ? 'new-images' : 'handoff') + (CUT[n] && src.startsWith(NEW) ? ', cut to its clean middle' : '')); used.push(n);
}
// Upright 2:3 panel beside the form.
{ const src = pick('apply-callback', [NEW]); if (src) { const f = join(OUT, 'apply-callback.webp');
  await cut(src, 'apply-callback').resize({ width: 600, height: 900, fit: 'cover' }).webp({ quality: 82, effort: 6 }).toFile(f); done(f, 'upright 2:3, from new-images'); used.push('apply-callback'); } }
// Real photos of the agency. Never an AI picture: these show Rathnaweera itself.
for (const [n, w, h] of [['janaka', 1200, 1500], ['team', 1800, 1200], ['office-ambalantota', 2400, 1350], ['office-colombo', 1600, 1067],
  ['staff-1', 800, 800], ['staff-2', 800, 800], ['staff-3', 800, 800], ['staff-4', 800, 800]]) {
  const src = pick(n, [REAL]); if (!src) continue;
  const f = join(OUT, 'real-' + n + '.webp');
  await sharp(src).rotate().resize({ width: w, height: h, fit: 'cover', withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toFile(f); done(f, 'real photo'); used.push('real-' + n);
}
if (!SCENES_ONLY) {
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

}
if (!SCENES_ONLY) writeFileSync(join(OUT, 'SOURCE.json'), JSON.stringify({ made_by: 'scripts/prep-images.mjs', seal_source: SEAL.replace(homedir(), '~'), seal_sha256: sealHash, handoff: HANDOFF.replace(homedir(), '~') }, null, 1) + '\n');
console.log(log.join('\n'));
