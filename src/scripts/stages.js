// HOW IT WORKS: seven stages as tabs. While the section is in view it plays by itself, one stage about every four
// seconds (the gold ring round the active stop shows the time left; its animationend moves on). Pressing a stop,
// an arrow, a key or swiping stops the play for good; the play button is the only thing that starts it again.
// The phone rail scrolls sideways only, never the page. Reduced motion: no autoplay, no slides, same states.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sec = $('[data-st]');

if (sec) {
  const rail = $('[data-st-rail]', sec), tabs = $$('[data-st-tab]', sec), panels = $$('[data-st-panel]', sec);
  const playBtn = $('[data-st-play]', sec), where = $('[data-st-where]', sec), live = where.parentElement;
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n = tabs.length;
  let at = 0, playing = !still(), seen = false;

  $('.st-panels', sec).setAttribute('role', 'presentation');
  panels.forEach((p, i) => { p.setAttribute('role', 'tabpanel'); p.tabIndex = i === 0 ? 0 : -1; p.classList.toggle('is-on', i === 0); });

  /* the line runs from the first ring's centre to the last; the plane hovers over the active stop */
  const mid = t => t.offsetLeft + t.offsetWidth / 2;
  const layout = () => {
    const a = mid(tabs[0]), b = mid(tabs[n - 1]);
    rail.style.setProperty('--st-l', a + 'px');
    rail.style.setProperty('--st-w', b - a + 'px');
    rail.style.setProperty('--st-f', (at / (n - 1)).toFixed(4));
    rail.style.setProperty('--st-x', mid(tabs[at]) - 15 + 'px');
  };
  const centre = smooth => {
    if (rail.scrollWidth <= rail.clientWidth + 1) return;
    const left = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, mid(tabs[at]) - rail.clientWidth / 2));
    rail.scrollTo({ left, behavior: smooth && !still() ? 'smooth' : 'auto' });
  };
  const setPlay = on => {
    playing = on;
    sec.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-label', on ? 'Pause the stages' : 'Play the stages');
  };
  const hold = () => sec.classList.toggle('is-held', !seen || document.hidden);

  const select = (to, user) => {
    to = (to + n) % n;
    if (user) setPlay(false);
    live.setAttribute('aria-live', user ? 'polite' : 'off');
    if (to === at) return;
    const from = at, dir = to > from ? 1 : -1;
    at = to;
    tabs.forEach((t, i) => {
      const on = i === to;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-done', i < to);
    });
    const out = panels[from], inn = panels[to];
    out.classList.remove('is-on'); out.tabIndex = -1;
    inn.classList.add('is-on'); inn.tabIndex = 0;
    where.textContent = String(to + 1);
    layout();
    centre(true);
    panels.forEach(p => p.getAnimations().forEach(a => a.cancel()));
    if (still()) return;
    out.classList.add('is-leaving');
    /* the slide is never longer than the room beside the panel, so a panel on its way in or out never stands past the screen edge and widens the page */
    const box = inn.getBoundingClientRect(), room = Math.min(box.left, document.documentElement.clientWidth - box.right) - 2;
    const far = Math.max(8, Math.min(44, room)), near = Math.min(36, far);
    const o = out.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * near}px)` }],
      { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    o.onfinish = o.oncancel = () => { out.classList.remove('is-leaving'); o.cancel(); };
    inn.animate([{ opacity: 0, transform: `translateX(${dir * far}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 560, delay: 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    /* the picture settles inside its frame: the frame itself never grows, so it cannot push past the screen edge */
    const pic = $('.st-pic .shot', inn);
    if (pic) pic.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 900, delay: 120, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
  };

  tabs.forEach((t, i) => t.addEventListener('click', () => select(i, true)));
  $('[data-st-prev]', sec).addEventListener('click', () => select(at - 1, true));
  $('[data-st-next]', sec).addEventListener('click', () => select(at + 1, true));
  playBtn.addEventListener('click', () => setPlay(!playing));
  rail.addEventListener('keydown', e => {
    const k = { ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: n - 1 }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    select(k, true);
    tabs[at].focus({ preventScroll: true });
  });
  /* the ring's animation is the clock: when it ends the next stage comes in */
  rail.addEventListener('animationend', e => { if (e.animationName === 'st-prog' && playing) select(at + 1, false); });

  /* swipe the panel sideways to move one stage; vertical drags stay the page's */
  let sx = 0, sy = 0, down = false;
  const stage = $('[data-st-stage]', sec);
  stage.addEventListener('pointerdown', e => { if (e.target.closest('button,a')) return; down = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', e => {
    if (!down) return; down = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) select(at + (dx < 0 ? 1 : -1), true);
  });
  stage.addEventListener('pointercancel', () => { down = false; });

  new IntersectionObserver(es => es.forEach(e => { seen = e.isIntersecting; hold(); }), { threshold: 0.35 }).observe(stage);
  document.addEventListener('visibilitychange', hold);
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); centre(false); }); });

  hold();
  setPlay(playing);
  layout();
  if (document.fonts) document.fonts.ready.then(layout);
}
