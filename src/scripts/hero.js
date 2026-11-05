// THE HERO FLIGHT. The plane rests on the gold ring at load and moves ONLY when the visitor scrolls or swipes:
// scrolling through the hero flies it one full orbit, in front of the globe on the near half and behind it on the
// far half (smaller), banking with the path and turning at the ends. A rAF lerp makes it glide after the finger.
// Scrolling back flies it back. Hero.astro draws the resting pose from the same `pose()`, so nothing jumps when
// this script arrives. Reduced motion or Save-Data: the plane simply rests.
export const ORBIT = { cx: 50, cy: 50, rx: 47, ry: 13, tilt: -12, a0: 148 };   // per cent of the art's width, degrees
const NOSE = -8;                                                                // the sprite's nose points right, 8 degrees up
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const norm = d => ((d + 540) % 360) - 180;

export const pose = (deg, o = ORBIT) => {
  const t = deg * Math.PI / 180, k = o.tilt * Math.PI / 180, c = Math.cos(k), s = Math.sin(k);
  const lx = o.rx * Math.cos(t), ly = o.ry * Math.sin(t);
  const vx0 = o.rx * Math.sin(t), vy0 = -o.ry * Math.cos(t);                    // travel as the angle falls
  const vx = vx0 * c - vy0 * s, vy = vx0 * s + vy0 * c, len = Math.hypot(vx, vy) || 1;
  const dir = Math.atan2(vy, vx) * 180 / Math.PI;
  const right = vx >= 0, turn = Math.max(Math.abs(vx / len), 0.16);              // narrows as it turns at the ends
  const rot = clamp(right ? dir - NOSE : norm(dir + 180 + NOSE), -18, 18);
  const sc = 0.8 + 0.2 * Math.sin(t);                                            // 1 at the front, .6 at the back
  return { x: o.cx + lx * c - ly * s, y: o.cy + lx * s + ly * c, rot, sx: (right ? 1 : -1) * turn * sc, sy: sc, front: Math.sin(t) > 0 };
};
export const vars = p => `--px:${p.x.toFixed(3)};--py:${p.y.toFixed(3)};--pr:${p.rot.toFixed(2)}deg;--psx:${p.sx.toFixed(4)};--psy:${p.sy.toFixed(4)}`;

if (typeof document !== 'undefined') {
  const art = document.querySelector('[data-hero-art]');
  const hero = art?.closest('[data-hero]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData;
  if (art && hero && !still) {
    let range = 1, cur = ORBIT.a0, raf = 0, last = 0;
    const measure = () => { const r = hero.getBoundingClientRect(); range = Math.max(360, r.bottom + scrollY - innerHeight * 0.2); };
    const goal = () => ORBIT.a0 - 360 * clamp(scrollY / range, 0, 1);
    const paint = () => {
      const p = pose(cur);
      for (const [k, v] of [['--px', p.x.toFixed(3)], ['--py', p.y.toFixed(3)], ['--pr', p.rot.toFixed(2) + 'deg'], ['--psx', p.sx.toFixed(4)], ['--psy', p.sy.toFixed(4)]]) art.style.setProperty(k, v);
      art.classList.toggle('is-back', !p.front);
    };
    const tick = now => {
      raf = 0;
      const dt = last ? Math.min(now - last, 64) : 16; last = now;
      const g = goal(), d = g - cur;
      cur = Math.abs(d) < 0.05 ? g : cur + d * (1 - Math.exp(-dt / 110));
      paint();
      if (cur !== g) raf = requestAnimationFrame(tick); else last = 0;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(tick); };
    measure();
    cur = goal();                     // a reload half way down starts where the page is, without a flight
    paint();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { measure(); queue(); });
    new ResizeObserver(() => { measure(); queue(); }).observe(hero);
  }
}
