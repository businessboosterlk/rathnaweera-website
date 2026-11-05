// THE ONE PLACE AN ICON IS WRITTEN. Every icon is a symbol in assets/icons.svg, which scripts/build-icons.mjs
// builds from Lucide. Nothing on this site types icon path data by hand (hand-svg.mjs allows this file once).
import { url } from '../config.js';
const SPRITE = url('assets/icons.svg');
export const icon = (name, cls = '') =>
  `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="${SPRITE}#${name}"></use></svg>`;
