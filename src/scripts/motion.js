// Small page wide motion that is not a reveal. Two jobs: the gold line under the status strip that fills as the
// page is read, and the footer's large name, which rises from behind its own edge the first time it scrolls into view.
// Both move transform only. Reduced motion: the line still tracks (it is information), the name is simply there.
const bar = document.querySelector('[data-progress]');
if (bar) {
  let queued = false;
  const set = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(set); } }, { passive: true });
  addEventListener('resize', set);
  set();
}

const word = document.querySelector('[data-rise]');
if (word && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const s = document.createElement('span');
  s.textContent = word.textContent.trim();
  word.textContent = ''; word.append(s); word.classList.add('rise');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { word.classList.add('in'); io.disconnect(); } }), { threshold: 0.35 });
  io.observe(word);
}
