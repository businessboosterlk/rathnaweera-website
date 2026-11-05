#!/usr/bin/env node
/* THE GLOBE TEXTURE. Drawn from real map data, never a picture: world-atlas land-110m through d3-geo onto an
   equirectangular sheet 2048 x 1024, rasterised by sharp to public/assets/earth.webp (budget 150 KB).
   The look follows the old hero globe: warm cream sea, deep navy land with a thin gold coast, a fine gold
   graticule, a small red dot on Sri Lanka and gold dots on the six Gulf capitals the agency sends to.
     node scripts/build-globe.mjs
   src/scripts/globe.js wraps this sheet round a sphere in WebGL. Coordinates are public geography only. */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { geoEquirectangular, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import sharp from 'sharp';

const W = 2048, H = 1024, OUT = 'public/assets/earth.webp', BUDGET = 150 * 1024;
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(proj);
const grat = geoGraticule().step([20, 20]).extentMajor([[-180, -90], [180, 90]])();
const dot = ([lon, lat], r, fill, ring) => { const [x, y] = proj([lon, lat]);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${ring}" stroke-width="3"/>`; };
const GULF = [[47.98, 29.37], [51.53, 25.29], [54.37, 24.45], [46.72, 24.71], [58.41, 23.59], [50.59, 26.23]]; // Kuwait City, Doha, Abu Dhabi, Riyadh, Muscat, Manama
const SRI_LANKA = [80.77, 7.87];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#F3EDE0"/>
  <path d="${path(grat)}" fill="none" stroke="#C8982A" stroke-opacity=".55" stroke-width="1.3"/>
  <path d="${path(land)}" fill="#0A3470" stroke="#C8982A" stroke-width="2.6" stroke-linejoin="round"/>
  ${GULF.map(p => dot(p, 8, '#E2B655', '#0A3470')).join('')}
  ${dot(SRI_LANKA, 11, '#C41E1E', '#F3EDE0')}
</svg>`;

const buf = await sharp(Buffer.from(svg)).webp({ quality: 82, effort: 6, smartSubsample: true }).toBuffer();
writeFileSync(OUT, buf);
const kb = statSync(OUT).size;
console.log(`${OUT}  ${W}x${H}  ${(kb / 1024).toFixed(1)} KB  ${kb <= BUDGET ? 'PASS' : 'FAIL over 150 KB'}`);
if (kb > BUDGET) process.exit(1);
