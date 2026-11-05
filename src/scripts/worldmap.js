// COUNTRIES WE SEND TO: the map camera and the country cards. No library, no history entry of its own.
// Press a country (button, pin or shape): the camera glides and zooms so that country sits at the focus point,
// the country glows and its card pops out of that point. Another country, Escape, the empty map or scrolling
// about a third of a screen away puts the card back into its spot and eases the map back out to the world.
// The card's "See jobs in ..." link belongs to jobs.js (data-country-tile). Reduced motion: same states, no glide.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sec = $('[data-wm]');

if (sec) {
  const meta = JSON.parse(sec.dataset.wmMeta);
  const stage = $('[data-wm-stage]', sec), svg = $('.wm-svg', sec), cam = $('.wm-cam', sec);
  const cards = Object.fromEntries($$('[data-wm-card]', sec).map(c => [c.dataset.wmCard, c]));
  const chips = Object.fromEntries($$('[data-wm-country]', sec).map(b => [b.dataset.wmCountry, b]));
  const parts = k => $$(`[data-wm-shape="${k}"],[data-wm-pin="${k}"],[data-wm-arc="${k}"]`, sec);
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  Object.values(cards).forEach(c => { c.hidden = true; });

  let open = null, base = 0, raf = 0, popTimer = 0;
  const geo = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.max(W / meta.w, H / meta.h);
    return { W, H, s, ox: (W - meta.w * s) / 2, oy: (H - meta.h * s) / 2, wide: W >= 600 };
  };
  /* at rest the map frames the route: the Gulf on one side, Sri Lanka on the other */
  const home = (() => {
    const cs = Object.values(meta.c).map(v => v.c), gx = cs.reduce((a, c) => a + c[0], 0) / cs.length, gy = cs.reduce((a, c) => a + c[1], 0) / cs.length;
    return [(gx + meta.sl[0]) / 2, (gy + meta.sl[1]) / 2];
  })();
  const rest = () => ({ cx: home[0], cy: home[1], k: geo().wide ? 1.5 : 1.35, fx: 0.5, fy: 0.5 });
  /* the focus point: left of centre on a wide map so the card fits beside it, high on a phone so the card fits under it */
  const target = k => {
    const g = geo(), { c, b } = meta.c[k];
    const ext = Math.max(b[2] - b[0], b[3] - b[1], 9);
    const D = (g.wide ? 0.34 : 0.3) * Math.min(g.W, g.H);
    const z = Math.min(6, Math.max(2.4, D / (g.s * ext)));
    return g.wide ? { cx: c[0], cy: c[1], k: z, fx: 0.36, fy: 0.5 } : { cx: c[0], cy: c[1], k: z, fx: 0.5, fy: 0.3 };
  };
  let cur = rest();
  const apply = v => {
    const g = geo();
    const tx = (v.fx * g.W - g.ox) / g.s - v.k * v.cx, ty = (v.fy * g.H - g.oy) / g.s - v.k * v.cy;
    cam.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${v.k.toFixed(4)})`);
    svg.style.setProperty('--k', (g.s * v.k).toFixed(4));
  };
  const ease = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const glide = (to, dur = 1000) => {
    cancelAnimationFrame(raf);
    if (still() || dur === 0) { cur = to; apply(cur); return; }
    const from = { ...cur }, t0 = performance.now(), lk0 = Math.log(from.k), lk1 = Math.log(to.k);
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = ease(p), m = (a, b) => a + (b - a) * e;
      cur = { cx: m(from.cx, to.cx), cy: m(from.cy, to.cy), k: Math.exp(m(lk0, lk1)), fx: m(from.fx, to.fx), fy: m(from.fy, to.fy) };
      apply(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  /* the card sits beside the focus point (wide) or across the foot of the map (phone), always inside the map */
  const place = (card, to) => {
    const g = geo(), fx = to.fx * g.W, fy = to.fy * g.H;
    card.style.width = g.wide ? '' : g.W - 24 + 'px';
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left, top;
    if (g.wide) {
      left = fx + 44; if (left + cw > g.W - 16) left = fx - 44 - cw;
      top = Math.min(Math.max(fy - ch / 2, 16), g.H - ch - 16);
    } else { left = 12; top = g.H - 12 - ch; }
    card.style.left = left + 'px'; card.style.top = top + 'px';
    card.style.transformOrigin = `${(fx - left).toFixed(1)}px ${(fy - top).toFixed(1)}px`;
  };
  const pop = card => {
    card.hidden = false;
    if (still()) return;
    card.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 620, easing: 'cubic-bezier(.34,1.45,.64,1)' });
    card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'linear' });
    const body = $('.wm-cbody', card);
    body.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 200, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  };
  const drop = card => {
    if (still() || card.hidden) { card.hidden = true; return; }
    card.getAnimations().forEach(a => a.cancel());
    const a = card.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 260, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    a.onfinish = () => { if (open !== card.dataset.wmCard) card.hidden = true; a.cancel(); };
  };
  const mark = k => {
    $$('.is-on', sec).forEach(e => e.classList.remove('is-on'));
    Object.entries(chips).forEach(([n, b]) => b.setAttribute('aria-expanded', String(n === k)));
    if (k) parts(k).forEach(e => e.classList.add('is-on'));
    sec.classList.toggle('is-open', !!k);
  };

  /* keep the whole map on screen when a card opens, then measure "scrolled away" from there */
  const inView = () => {
    const r = stage.getBoundingClientRect();
    const head = $('.site-head'), hb = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().bottom : 0;
    const bar = $('.phonebar'), bb = bar && bar.offsetParent !== null ? bar.offsetHeight : 0;
    const top = hb + 8, bottom = innerHeight - bb - 8;
    let d = 0;
    if (r.top < top || r.bottom > bottom) d = r.top - top; /* top aligned, so the phone list under the map stays in reach */
    base = scrollY + d;
    if (Math.abs(d) > 1) scrollTo({ top: base, behavior: still() ? 'auto' : 'smooth' });
  };

  const show = k => {
    if (open === k) return;
    const prev = open; open = k;
    clearTimeout(popTimer);
    mark(k);
    if (prev) drop(cards[prev]);
    const to = target(k);
    glide(to, prev ? 900 : 1000);
    inView();
    const card = cards[k];
    card.getAnimations().forEach(a => a.cancel());
    card.hidden = false; card.style.visibility = 'hidden';
    place(card, to);
    card.style.visibility = '';
    card.hidden = true;
    if (still()) { card.hidden = false; return; }
    popTimer = setTimeout(() => { if (open === k) pop(card); }, prev ? 320 : 140);
  };
  const close = (focusBack = false) => {
    if (!open) return;
    const k = open; open = null;
    clearTimeout(popTimer);
    const card = cards[k], had = card.contains(document.activeElement);
    mark(null);
    drop(card);
    glide(rest(), 900);
    if (focusBack || had) chips[k].focus({ preventScroll: true });
  };

  Object.entries(chips).forEach(([k, b]) => b.addEventListener('click', () => (open === k ? close() : show(k))));
  svg.addEventListener('click', e => {
    const hit = e.target.closest('[data-wm-shape],[data-wm-pin]');
    const k = hit && (hit.dataset.wmShape || hit.dataset.wmPin);
    if (k) show(k); else close();
  });
  $$('[data-wm-close]', sec).forEach(b => b.addEventListener('click', () => close(true)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && open) close(sec.contains(document.activeElement)); });
  addEventListener('scroll', () => { if (open && Math.abs(scrollY - base) > innerHeight / 3) close(); }, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => {
    cancelAnimationFrame(raf); cur = open ? target(open) : rest(); apply(cur); if (open) place(cards[open], cur); }); });

  /* the arcs draw once the map is on screen; pins pulse only while it is; card pictures load on the way in */
  const io = new IntersectionObserver(es => es.forEach(e => {
    sec.classList.toggle('is-vis', e.isIntersecting);
    if (e.isIntersecting && e.intersectionRatio > 0.25) sec.classList.add('is-in');
  }), { threshold: [0, 0.3] });
  io.observe(stage);
  const pre = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { $$('img[loading="lazy"]', sec).forEach(i => { i.loading = 'eager'; }); pre.disconnect(); } }, { rootMargin: '600px 0px' });
  pre.observe(sec);
  apply(cur);
  sec.classList.add('wm-ready');
}
