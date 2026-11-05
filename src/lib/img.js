// PICTURES BY NAME. Every master in src/assets/img is found by its file name, so a new picture drops in by
// saving it under the same name and running `npm run images`. A name with no file returns null and the page
// draws a stand-in (src/components/Shot.astro). Names are listed in scripts/prep-images.mjs.
const all = import.meta.glob('../assets/img/*.webp', { eager: true, import: 'default' });
export const img = name => all[`../assets/img/${name}.webp`] ?? null;
