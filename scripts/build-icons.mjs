// EVERY ICON ON THIS SITE COMES FROM LUCIDE (ISC licence) THROUGH THIS FILE. NOBODY DRAWS ONE BY HAND.
// Writes src/data/icons.json (the record) and public/assets/icons.svg (the one sprite the page draws from).
// `--check` fails if either file differs from what the package produces, which is how the gate proves no
// icon was edited or added by hand. Follows ~/bb-websites/sastho/scripts/build-icons.mjs.
//   node scripts/build-icons.mjs          write
//   node scripts/build-icons.mjs --check  verify (runs first in npm run build)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const LINE = {            // our name    Lucide's file
  menu: 'menu', close: 'x', phone: 'phone', arrow: 'arrow-right', external: 'external-link',
  pin: 'map-pin', clock: 'clock', down: 'chevron-down', check: 'check', alert: 'circle-alert', file: 'file-text',
};

const inner = svg => svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
const ver = JSON.parse(readFileSync('node_modules/lucide-static/package.json', 'utf8')).version;
const out = { _source: 'lucide-static ' + ver + ' (ISC)', line: {} };
for (const [k, f] of Object.entries(LINE)) out.line[k] = inner(readFileSync(`node_modules/lucide-static/icons/${f}.svg`, 'utf8'));

const json = JSON.stringify(out, null, 1) + '\n';
const sprite = '<!-- Built by scripts/build-icons.mjs from ' + out._source + '. Do not edit by hand. -->\n'
  + '<svg xmlns="http://www.w3.org/2000/svg">\n'
  + Object.entries(out.line).map(([k, v]) => `<symbol id="${k}" viewBox="0 0 24 24">${v}</symbol>`).join('\n') + '\n</svg>\n';

const J = 'src/data/icons.json', S = 'public/assets/icons.svg';
if (process.argv.includes('--check')) {
  const bad = [[J, json], [S, sprite]].filter(([f, want]) => !existsSync(f) || readFileSync(f, 'utf8') !== want).map(([f]) => f);
  if (bad.length) { console.error('FAIL  ' + bad.join(' and ') + ' do not match lucide-static. Run: npm run icons'); process.exit(1); }
  console.log('PASS  icons match lucide-static: ' + Object.keys(out.line).length + ' line icons');
} else {
  mkdirSync('src/data', { recursive: true }); mkdirSync('public/assets', { recursive: true });
  writeFileSync(J, json); writeFileSync(S, sprite);
  console.log('wrote ' + J + ' and ' + S + ': ' + Object.keys(out.line).length + ' line icons');
}
