// PICTURES BY NAME. Every master in src/assets/img is found by its file name, so a new picture drops in by
// saving it under the same name and running `npm run images`. A name with no file returns null and the page
// draws a stand-in (src/components/Shot.astro). Names are listed in scripts/prep-images.mjs.
const all = import.meta.glob('../assets/img/*.webp', { eager: true, import: 'default' });
export const img = name => all[`../assets/img/${name}.webp`] ?? null;

// FOCUS (5 Nov 2026). Every slot crops its picture to fill (object-fit: cover) and the crop is centred unless the
// picture is named here. These six lose their subject in a wide or upright slot when centred: tower tops on the map
// cards, the tick column and the camera in the upright guide cards. The value is a CSS object-position.
const FOCUS = {
  'country-uae': '50% 0', 'country-bahrain': '50% 0', 'country-saudi-arabia': '50% 10%', 'country-kuwait': '85% 15%',
  'guide-legal-steps': '18% 50%', 'guide-videos': '100% 50%',
};
export const focus = name => FOCUS[name] ?? null;
