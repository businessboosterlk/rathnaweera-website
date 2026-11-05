// THE ONE PLACE THE WORLD MAP IS WRITTEN AS MARKUP. Every coordinate comes from src/data/world-map.json, which
// scripts/build-map.mjs generates from world-atlas (Natural Earth). Nothing here is drawn by hand: this file only
// wraps the generated geometry in elements. Sizes that must stay the same on screen whatever the zoom (pins,
// strokes, the Sri Lanka label) are scaled in CSS by 1 / --k, which src/scripts/worldmap.js sets every frame.
import map from '../data/world-map.json';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const pin = (k, [x, y], i) =>
  `<g class="wm-pin" data-wm-pin="${k}" transform="translate(${x} ${y})" style="--i:${i}"><g class="wm-pz">` +
  `<circle class="wm-hit" r="22"></circle><circle class="wm-pulse" r="5"></circle><circle class="wm-dot" r="5"></circle></g></g>`;

export const worldMap = (order, names) => {
  const { w, h } = map;
  const shapes = order.map(k => `<path class="wm-c" data-wm-shape="${k}" d="${map.countries[k].d}"><title>${esc(names[k])}</title></path>`).join('');
  const arcs = order.map((k, i) => `<path class="wm-arc" data-wm-arc="${k}" pathLength="1" style="--i:${i}" d="${map.arcs[k]}"></path>`).join('');
  const pins = order.map((k, i) => pin(k, map.countries[k].c, i)).join('');
  const [sx, sy] = map.sl.c;
  return `<svg class="wm-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
    `<rect class="wm-sea" data-wm-sea x="${-w}" y="${-h}" width="${w * 3}" height="${h * 3}"></rect>` +
    `<g class="wm-cam">` +
    `<path class="wm-grat" d="${map.grat}"></path>` +
    `<path class="wm-land" d="${map.land}"></path>` +
    `<path class="wm-sl" d="${map.sl.d}"></path>` +
    shapes + `<g class="wm-arcs">${arcs}</g>` + pins +
    `<g class="wm-home" transform="translate(${sx} ${sy})"><g class="wm-pz"><circle class="wm-hring" r="11"></circle><circle class="wm-hdot" r="5.5"></circle>` +
    `<text class="wm-hlabel" x="16" y="5">Sri Lanka</text></g></g>` +
    `</g></svg>`;
};

/* The numbers the script needs to aim the camera: the view box, each country's centre and box. */
export const mapMeta = order => ({
  w: map.w, h: map.h, sl: map.sl.c,
  c: Object.fromEntries(order.map(k => [k, { c: map.countries[k].c, b: map.countries[k].b }])),
});
