// The page's only script. Five small jobs: the hero flight, the phone menu, the country filter, the
// readiness checklist and the two step form preview. No library. The page works without it: every link is a
// real anchor, the plane rests in a static pose and the form's buttons stay disabled, so nothing can be sent.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

/* ---------- 1. Hero flight: the plane flies the front of the orbit as the page scrolls ---------- */
(() => {
  const art = $('[data-hero-art]');
  if (!art) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
  if (still) return;                                   // keeps the CSS static pose
  const plane = $('.plane', art), globe = $('.globe', art);
  const NOSE = -8;                                     // the sprite's nose points right and about 8 degrees up
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  let g = null, visible = true, queued = false;
  const geometry = () => {
    const cs = getComputedStyle(art), W = art.clientWidth, H = art.clientHeight, n = k => parseFloat(cs.getPropertyValue(k));
    g = { W, H, cx: n('--ocx') / 100 * W, cy: n('--ocy') / 100 * H, rx: n('--orx') / 100 * W, ry: n('--ory') / 100 * H,
      tilt: n('--otilt') * Math.PI / 180, pw: plane.offsetWidth, ph: plane.offsetHeight };
  };
  const draw = () => {
    queued = false;
    if (!g) geometry();
    const p = clamp(scrollY / (innerHeight * 0.85), 0, 1);
    // 0 to 15 per cent: pose. 15 to 80: the flight along the front arc. 80 to 100: a short drift.
    const flight = ease(clamp((p - 0.15) / 0.65, 0, 1));
    const drift = clamp((p - 0.8) / 0.2, 0, 1);
    const deg = 160 - 150 * flight - 8 * drift;
    const t = deg * Math.PI / 180, c = Math.cos(g.tilt), s = Math.sin(g.tilt);
    const lx = g.rx * Math.cos(t), ly = g.ry * Math.sin(t);
    const x = g.cx + lx * c - ly * s, y = g.cy + lx * s + ly * c;
    const dx0 = g.rx * Math.sin(t), dy0 = -g.ry * Math.cos(t);          // direction of travel as the angle falls
    const dir = Math.atan2(dx0 * s + dy0 * c, dx0 * c - dy0 * s) * 180 / Math.PI;
    const bank = clamp(dir - NOSE, -14, 14);
    const scale = 0.9 + 0.12 * Math.sin(t);
    plane.style.transform = `translate(${(x - g.pw / 2).toFixed(1)}px,${(y - g.ph / 2).toFixed(1)}px) rotate(${bank.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    globe.style.setProperty('--gtilt', (-2 + 4 * p).toFixed(2) + 'deg');
  };
  const queue = () => { if (visible && !queued) { queued = true; requestAnimationFrame(draw); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; queue(); }).observe(art);
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { g = null; queue(); });
  art.classList.add('moving');
  draw();
})();

/* ---------- 2. Desk header hairline once something scrolls under it ---------- */
(() => {
  const head = $('.site-head');
  const set = () => head.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', set, { passive: true }); set();
})();

/* ---------- 3. Phone menu. Opening adds one history entry, so Back closes it. ---------- */
const menu = $('#menu'), openBtn = $('[data-menu-open]');
const showMenu = on => {
  menu.hidden = !on; document.body.classList.toggle('menu-open', on); openBtn.setAttribute('aria-expanded', String(on));
  if (on) $('[data-menu-close]').focus(); else openBtn.focus({ preventScroll: true });
};
openBtn.addEventListener('click', () => { history.pushState({ ...(history.state || {}), menu: true }, ''); showMenu(true); });
$('[data-menu-close]').addEventListener('click', () => history.back());
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) history.back(); });
$$('#menu a').forEach(a => a.addEventListener('click', e => {
  // Replace the menu's own entry with the section, so Back then leaves the section, not a closed menu.
  e.preventDefault();
  const hash = a.getAttribute('href');
  history.replaceState({ country: filter }, '', hash);
  showMenu(false);
  $(hash)?.scrollIntoView();
}));

/* ---------- 4. Country filter. Each choice is one history entry, so Back undoes it. ---------- */
let filter = null;
const names = Object.fromEntries($$('[data-country-tile]').map(b => [b.dataset.countryTile, $('.tile-name', b).textContent]));
const applyFilter = key => {
  filter = key || null;
  $$('.jobs .job').forEach(j => { j.hidden = !!filter && j.dataset.country !== filter; });
  $$('[data-country-tile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.countryTile === filter)));
  const line = $('[data-filter-line]');
  line.hidden = !filter;
  if (filter) $('[data-filter-text]').textContent = 'Showing jobs in ' + names[filter] + '.';
};
$$('[data-country-tile]').forEach(b => b.addEventListener('click', () => {
  history.pushState({ country: b.dataset.countryTile }, '', '#jobs');
  applyFilter(b.dataset.countryTile);
  $('#jobs').scrollIntoView();
}));
$$('[data-show-all]').forEach(b => b.addEventListener('click', () => {
  if (filter) history.pushState({ country: null }, '', '#jobs');
  applyFilter(null);
  $('#jobs').scrollIntoView();
}));
addEventListener('popstate', e => {
  if (!menu.hidden && !e.state?.menu) showMenu(false);
  applyFilter(e.state?.country ?? null);
});
if (history.state?.country) applyFilter(history.state.country);

/* ---------- 5. Am I ready to apply? ---------- */
const docs = $$('.checklist input');
const readyTitle = $('[data-ready-title]'), readyList = $('[data-ready-list]');
const readyState = () => {
  const missing = docs.filter(d => !d.checked).map(d => d.value);
  readyTitle.textContent = missing.length ? `You still need ${WORDS[missing.length]} thing${missing.length > 1 ? 's' : ''}` : 'You have every document on this list';
  readyList.textContent = missing.length ? missing.join(', ') : 'Bring them all to the office when we call you.';
  return missing;
};
docs.forEach(d => d.addEventListener('change', readyState));
readyState();

/* ---------- 6. The form preview. It never sends anything: method post, no action, submit stopped here. ---------- */
const form = $('[data-apply-form]');
const F = n => form.elements[n];
const steps = Object.fromEntries($$('[data-step]', form).map(s => [s.dataset.step, s]));
const go = (k, focus = true) => {
  Object.entries(steps).forEach(([n, s]) => { s.hidden = n !== k; });
  if (focus) (k === 'done' ? steps.done : $('input,select', steps[k]))?.focus({ preventScroll: true });
};
const mobile = v => { const d = v.replace(/[\s-]/g, '').replace(/^\+94/, '0').replace(/^94(?=7)/, '0'); return /^07\d{8}$/.test(d) ? d : null; };
const nicOk = v => !v || /^(\d{9}[vVxX]|\d{12})$/.test(v.replace(/\s/g, ''));
const fail = (step, msg, field) => {
  const e = $(`[data-err="${step}"]`, form); e.textContent = msg; e.hidden = !msg;
  $$('input', steps[step]).forEach(i => i.removeAttribute('aria-invalid'));
  if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  return !msg;
};
const step1 = () => {
  if (!F('full_name').value.trim()) return fail('1', 'Please write your full name.', F('full_name'));
  if (!mobile(F('phone').value)) return fail('1', 'Write a mobile number that starts with 07 and has 10 digits.', F('phone'));
  return fail('1', '');
};
const step2 = () => {
  if (!nicOk(F('nic').value)) return fail('2', 'An NIC number has 12 digits, or 9 digits and a V or X.', F('nic'));
  if (!F('consent').checked) return fail('2', 'Tick the box so we may call you.', F('consent'));
  return fail('2', '');
};
$('[data-next]', form).disabled = false;
$('[data-submit]', form).disabled = false;
$('[data-next]', form).addEventListener('click', () => { if (step1()) { carryDocs(); go('2'); } });
$('[data-back]', form).addEventListener('click', () => go('1'));
$('[data-restart]', form).addEventListener('click', () => { form.reset(); readyState(); $('[data-picked]').hidden = true; go('1'); });
const carryDocs = () => {
  const have = docs.filter(d => d.checked).map(d => d.value), line = $('[data-docs-line]');
  line.hidden = !have.length;
  line.textContent = have.length ? 'From your checklist, you have: ' + have.join(', ') + '.' : '';
};
form.addEventListener('submit', e => {
  e.preventDefault();                                   // staging: nothing leaves this page (bb_pending 1242)
  if (!step2() || F('website').value) return;
  const opt = n => F(n).selectedOptions[0]?.textContent;
  const rows = [['Name', F('full_name').value.trim()], ['Mobile', mobile(F('phone').value)], ['Country', opt('country_wanted')], ['Job', opt('job_wanted')],
    ['NIC', F('nic').value.trim() || 'Not given'], ['Passport', F('passport_no').value.trim() || 'Not given'],
    ['Documents', docs.filter(d => d.checked).map(d => d.value).join(', ') || 'None ticked']];
  const dl = $('[data-summary]', form); dl.replaceChildren();
  rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
  go('done');
});
// "Apply for this job" and "Apply with these answers" fill the form before the anchor takes the reader there.
$$('[data-apply-job]').forEach(a => a.addEventListener('click', () => {
  F('job_wanted').value = a.dataset.applyJob; F('country_wanted').value = a.dataset.applyCountry;
  const p = $('[data-picked]'); p.hidden = false; p.textContent = 'You picked: ' + opt2('job_wanted') + ', ' + opt2('country_wanted') + '.';
  if (!steps.done.hidden) go('1', false);
}));
const opt2 = n => F(n).selectedOptions[0]?.textContent;
$('[data-apply-ready]').addEventListener('click', () => { carryDocs(); if (!steps.done.hidden) go('1', false); });
