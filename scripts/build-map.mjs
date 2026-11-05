#!/usr/bin/env node
/* THE WORLD MAP DATA for "Countries we send to". Run by hand when the map must change:
     node scripts/build-map.mjs
   Reads world-atlas (Natural Earth, public domain) through topojson-client and d3-geo, projects it with Natural
   Earth centred on 65 E so the Gulf and Sri Lanka sit in the middle, and writes src/data/world-map.json:
   the land as one shape, a fine graticule, Sri Lanka and the six countries as their own shapes, each country's
   centre point and box, and one arc from Sri Lanka to each country. Nothing here is drawn by hand: every
   coordinate comes from the atlas. src/lib/worldmap.js turns this file into svg markup at build time.
   Detail is kept where the map zooms (the Gulf and Sri Lanka) and thinned everywhere else, so the file stays small. */
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';

const atlas = f => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${f}`, import.meta.url)));
const land50 = atlas('land-50m.json'), c50 = atlas('countries-50m.json');
const land = feature(land50, land50.objects.land);
const countries = feature(c50, c50.objects.countries).features;

const KEYS = { kuwait: '414', qatar: '634', uae: '784', saudi: '682', oman: '512', bahrain: '048' };
const SRI_LANKA = '144';

/* Projection: 1000 units from 20 W to 150 E along the equator. */
const W = 1000;
const proj = geoNaturalEarth1().rotate([-65, 0]).scale(1).translate([0, 0]);
const span = proj([150, 0])[0] - proj([-20, 0])[0];
proj.scale(W / span);
const x0 = proj([-20, 0])[0], yTop = proj([65, 66])[1], yBot = proj([65, -38])[1];
proj.translate([-x0, -yTop]);
const H = Math.round(yBot - yTop);
proj.clipExtent([[-20, -20], [W + 20, H + 20]]);

/* the zoom window: where the camera goes, so detail is kept here */
const [wx0, wy0] = proj([28, 36]), [wx1, wy1] = proj([84, 4]);
const inWin = ([x, y]) => x > wx0 && x < wx1 && y > wy0 && y < wy1;

/* collect projected rings through a path context */
const rings = geo => {
  const out = []; let cur = null;
  geoPath(proj, {
    moveTo(x, y) { cur = [[x, y]]; out.push(cur); },
    lineTo(x, y) { cur.push([x, y]); },
    closePath() {}, arc() {},
  })(geo);
  return out;
};

/* Douglas Peucker on one ring */
const dp = (pts, tol) => {
  if (pts.length < 4) return new Uint8Array(pts.length).fill(1);
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    /* a ring cut by the map's edge comes back with its first point repeated at the end: there is no line to
       measure from, so measure from the point itself, or the whole continent collapses to nothing */
    for (let i = a + 1; i < b; i++) { const d = L > 1e-6 ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L : Math.hypot(pts[i][0] - ax, pts[i][1] - ay); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return keep;
};
const area = r => { let s = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s / 2); };

/* compact path: absolute points rounded, then written as relative steps so nothing drifts */
const fmt = n => { const s = (Math.round(n * 10) / 10).toString(); return s.replace(/^(-?)0\./, '$1.'); };
const encode = (rs, { fine = 0.025, coarse = 0.3, minArea = 1.5, closed = true } = {}) => rs.map(r => {
  /* fine detail only for the points inside the zoom window, coarse for the rest of the same ring, so a continent
     that merely touches the window does not carry fine detail all the way round */
  const win = r.some(inWin);
  const kc = dp(r, coarse), kf = win ? dp(r, fine) : kc;
  const r10 = v => Math.round(v * 10) / 10;
  let p = r.filter((q, i) => kc[i] || (kf[i] && inWin(q))).map(q => inWin(q) ? [r10(q[0]), r10(q[1])] : [Math.round(q[0]), Math.round(q[1])]);
  p = p.filter((q, i, a) => !i || q[0] !== a[i - 1][0] || q[1] !== a[i - 1][1]);
  if (closed && (p.length < 3 || (!win && area(p) < minArea))) return '';
  let d = `M${fmt(p[0][0])} ${fmt(p[0][1])}`, prev = p[0], body = '';
  for (let i = 1; i < p.length; i++) {
    const dx = fmt(p[i][0] - prev[0]), dy = fmt(p[i][1] - prev[1]);
    const part = (dx.startsWith('-') || !body ? dx : ' ' + dx) + (dy.startsWith('-') ? dy : ' ' + dy);
    body += part; prev = p[i];
  }
  return d + 'l' + body + (closed ? 'z' : '');
}).join('');

const byId = id => countries.find(c => c.id === id);
const path = geoPath(proj);
const r1 = v => Math.round(v * 10) / 10;
const shape = f => ({ d: encode(rings(f), { fine: 0.05, coarse: 0.05, minArea: 0 }), c: path.centroid(f).map(r1), b: path.bounds(f).flat().map(r1) });

const sl = shape(byId(SRI_LANKA));
const out = { w: W, h: H, land: encode(rings(land)), grat: '', sl, countries: {}, arcs: {} };
/* graticule every 15 degrees, as open lines */
out.grat = encode(rings(geoGraticule().step([15, 15]).extent([[-30, -60], [175, 80]])()), { fine: 0.6, coarse: 0.6, closed: false });

for (const [k, id] of Object.entries(KEYS)) {
  const s = shape(byId(id));
  out.countries[k] = s;
  /* an arc from Sri Lanka that bows north, its control point off the midpoint by a share of the distance */
  const [ax, ay] = sl.c, [bx, by] = s.c, mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  let nx = -dy / L, ny = dx / L; if (ny > 0) { nx = -nx; ny = -ny; }
  const bow = L * 0.28;
  out.arcs[k] = `M${r1(ax)} ${r1(ay)}Q${r1(mx + nx * bow)} ${r1(my + ny * bow)} ${r1(bx)} ${r1(by)}`;
}

const json = JSON.stringify(out);
writeFileSync(new URL('../src/data/world-map.json', import.meta.url), json + '\n');
console.log(`world-map.json ${(json.length / 1024).toFixed(1)} KB, ${W}x${H}, land ${(out.land.length / 1024).toFixed(1)} KB, graticule ${(out.grat.length / 1024).toFixed(1)} KB`);
for (const [k, s] of Object.entries(out.countries)) console.log(`  ${k.padEnd(8)} centre ${s.c.join(',')}  box ${s.b.join(',')}  ${s.d.length} chars`);
console.log(`  sri lanka centre ${sl.c.join(',')}`);
