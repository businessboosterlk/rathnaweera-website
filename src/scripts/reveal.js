// The page's one reveal. Pieces marked data-reveal arrive as they scroll into view; children of data-stagger
// arrive one after another. Reduced motion, or no IntersectionObserver, shows everything at once.
// Section headings arrive word by word from behind a mask, the same move as the hero's first line: each word is
// wrapped here, so the markup stays plain text and a page without the script simply shows the heading.
document.querySelectorAll('main h2').forEach(h => {
  if (h.children.length) return;
  const words = h.textContent.trim().split(/\s+/);
  h.textContent = '';
  words.forEach((w, i) => {
    const o = document.createElement('span'), s = document.createElement('span');
    o.className = 'sw'; s.textContent = w; s.style.setProperty('--w', i);
    o.append(s); h.append(o, i < words.length - 1 ? ' ' : '');
  });
  h.classList.add('split');
  const host = h.closest('[data-reveal]');
  if (!host || host === h) h.setAttribute('data-reveal', 'words');
});
const els = [...document.querySelectorAll('[data-reveal]')];
document.querySelectorAll('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
window.__rv = 1;
if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) els.forEach(e => e.classList.add('in'));
else {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(e => io.observe(e));
}
