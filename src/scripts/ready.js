// AM I READY TO APPLY? (was site.js section 5, same words and hooks). Ticks update the title, the missing list, the
// ring and the count. The apply form imports `docs` and `readyState` from here for its summary and Start again.
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
const root = document.getElementById('ready');
export const docs = root ? [...root.querySelectorAll('.checklist input')] : [];
const readyTitle = root?.querySelector('[data-ready-title]'), readyList = root?.querySelector('[data-ready-list]');
const ring = root?.querySelector('[data-rd-ring]'), count = root?.querySelector('[data-rd-count]'), card = root?.querySelector('[data-rd-card]');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nudge = el => { if (!still && el?.animate) el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' }); };
let last = -1;

export const readyState = () => {
  if (!root) return [];
  const missing = docs.filter(d => !d.checked).map(d => d.value);
  const title = missing.length ? `You still need ${WORDS[missing.length]} thing${missing.length > 1 ? 's' : ''}` : 'You have every document on this list';
  const list = missing.length ? missing.join(', ') : 'Bring them all to the office when we call you.';
  const have = docs.length - missing.length;
  if (readyTitle.textContent !== title) { readyTitle.textContent = title; if (last >= 0) nudge(readyTitle); }
  if (readyList.textContent !== list) { readyList.textContent = list; if (last >= 0) nudge(readyList); }
  ring.style.setProperty('--rd-p', String(have / docs.length));
  ring.dataset.have = String(have);
  if (count.textContent !== String(have)) { count.textContent = String(have); if (last >= 0) nudge(count); }
  card.classList.toggle('rd-all', !missing.length);
  last = have;
  return missing;
};

docs.forEach(d => d.addEventListener('change', readyState));
readyState();
