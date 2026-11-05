// Runs after every build (npm run build) and in CI. Fails the build on the faults this site must never ship:
// the seal from before the 4 Nov repair, a picture pasted into the page, an over budget picture, a page
// that can be found by search engines while staging, a form that could send data, or an invented fact.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const D = 'dist', fails = [], passes = [];
const ok = (name, cond, why = '') => (cond ? passes : fails).push(name + (cond || !why ? '' : '  ' + why));
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(D), html = readFileSync(join(D, 'index.html'), 'utf8');
const OLD = 'e1352e0c6c3894bd96ac30ed451fdc2dd4888b4f4a67534d8791b9af6b25d2fa';

const src = JSON.parse(readFileSync('src/assets/img/SOURCE.json', 'utf8'));
ok('seal masters come from the repaired seal', src.seal_sha256 === '5f05315b7d4c67bcbcc4f37ee7e5a906f5fff3378360d7cbbfcc18b8d4880e4e', src.seal_sha256);
ok('no built file is the old seal', !files.some(f => createHash('sha256').update(readFileSync(f)).digest('hex') === OLD));
const srcText = walk('src').filter(f => /\.(astro|js|css)$/.test(f)).map(f => readFileSync(f, 'utf8')).join('\n');
ok('no source names the old seal files', !/seal-original|assets\/seal\.png/.test(srcText));
ok('no picture pasted into the page', !/data:image\/(png|jpe?g|webp|avif)/.test(html));
const imgs = files.filter(f => /\.(avif|webp|png|jpe?g)$/.test(f)).map(f => [f, statSync(f).size]);
const big = imgs.filter(([, s]) => s > 200 * 1024);
ok('every picture under 200 KB', !big.length, big.map(([f, s]) => f + ' ' + Math.round(s / 1024) + ' KB').join(', '));
ok('staging page says noindex', /<meta name="robots" content="noindex, nofollow"/.test(html));
ok('robots.txt closes the staging site', /Disallow: \//.test(readFileSync(join(D, 'robots.txt'), 'utf8')));
ok('viewport-fit=cover', /viewport-fit=cover/.test(html));
ok('form posts nowhere (no action, method post)', /<form[^>]*method="post"/.test(html) && !/<form[^>]*action=/.test(html));
ok('form buttons start disabled', /data-next[^>]*disabled|disabled[^>]*data-next/.test(html) && /data-submit[^>]*disabled|disabled[^>]*data-submit/.test(html));
ok('no tel: or wa.me link before the numbers are confirmed', !/href="tel:|wa\.me|api\.whatsapp/.test(html));
const sat = (html.match(/var\(--sat\)/g) || []).length, sab = (html.match(/var\(--sab\)/g) || []).length;
ok('safe area insets used, not only declared (sat ' + sat + ', sab ' + sab + ')', sat >= 3 && sab >= 3);
ok('overflow-x clip, never hidden on the page', !/body\{[^}]*overflow-x:hidden/.test(html));
const sample = (html.match(/>SAMPLE</g) || []).length, ph = (html.match(/class="ph"/g) || []).length;
ok('SAMPLE labels kept (' + sample + ')', sample >= 14);
ok('gold dashed placeholders kept (' + ph + ')', ph >= 40);
const shots = (html.match(/<img[^>]*class="shot[ "]/g) || []).length, waits = (html.match(/class="shot shot-wait/g) || []).length, foci = (html.match(/style="object-position:/g) || []).length;
ok('every scene picture is on the page (' + shots + ' pictures, ' + waits + ' stand in plates)', shots >= 24 && waits === 0);
ok('six pictures keep their focus point (' + foci + ')', foci === 6);
ok('Stage 2 is not on the page', !/Departures and stories|Stage 2/.test(html));
ok('404, sitemap and llms.txt built', ['404.html', 'sitemap.xml', 'llms.txt'].every(f => existsSync(join(D, f))));

/* the page made of components (5 Nov 2026): the globe's picture, the map's data and the script all stay light */
const kb = f => existsSync(f) ? Math.round(statSync(f).size / 1024) : -1;
ok('the globe picture is there and under 200 KB (' + kb('public/assets/earth.webp') + ' KB)', kb('public/assets/earth.webp') >= 0 && statSync('public/assets/earth.webp').size < 200 * 1024);
ok('the world map data is under 70 KB (' + kb('src/data/world-map.json') + ' KB)', existsSync('src/data/world-map.json') && statSync('src/data/world-map.json').size < 70 * 1024);
const js = files.filter(f => /\.m?js$/.test(f)), jsBytes = js.reduce((n, f) => n + statSync(f).size, 0);
ok('all the script in the build is under 100 KB (' + Math.round(jsBytes / 1024) + ' KB in ' + js.length + ' files)', jsBytes < 100 * 1024);
/* a preview that sends nothing: no script in the build or the page can reach out on its own */
const callers = [...js, join(D, 'index.html')].filter(f => /\bfetch\(|XMLHttpRequest|sendBeacon/.test(readFileSync(f, 'utf8'))).map(f => f + ' ' + (readFileSync(f, 'utf8').match(/.{0,40}(\bfetch\(|XMLHttpRequest|sendBeacon).{0,40}/) || [''])[0]);
ok('no fetch, XMLHttpRequest or sendBeacon in any built script or the page', !callers.length, callers.join(' | '));
/* every icon comes from the icon set and the map from its data, never drawn by hand in a component (the two
   builders are the only places allowed; generated data such as icons.json is not code and is not read here) */
const drawn = walk('src').filter(f => /\.(astro|m?js|ts|css)$/.test(f) && !/src\/lib\/(icon|worldmap)\.js$/.test(f)).filter(f => /<svg|<path d=/.test(readFileSync(f, 'utf8')));
ok('no hand drawn <svg or <path d= in src outside lib/icon.js and lib/worldmap.js', !drawn.length, drawn.join(', '));

console.log(passes.map(p => 'PASS  ' + p).join('\n'));
if (fails.length) { console.error(fails.map(f => 'FAIL  ' + f).join('\n')); console.error('check-dist: FAIL ' + passes.length + ' of ' + (passes.length + fails.length)); process.exit(1); }
console.log('check-dist: PASS ' + passes.length + ' of ' + passes.length);
