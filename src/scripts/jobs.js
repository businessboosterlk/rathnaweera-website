// JOBS OPEN NOW: the country filter (moved here from site.js section 4, same behaviour). Each choice is one
// history entry, so Back undoes it; Show all clears it and is one entry too, only when a filter was on.
// New here: the cards move. Cards that leave fade and shrink where they stood, cards that stay glide to their new
// place (first, last, invert, play), cards that arrive rise in. The gold pill behind the chips slides to the choice.
// Reduced motion: the same states, no movement. Without this script every card simply shows.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const section = $('#jobs');

if (section) {
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid = $('.jobs', section), cards = $$('.job', grid);
  const line = $('[data-filter-line]'), text = $('[data-filter-text]');
  const chips = $('[data-jb-chips]', section), ind = $('.jb-ind', section);
  const names = {};
  $$('[data-country-tile][data-name]').forEach(b => { names[b.dataset.countryTile] = b.dataset.name; });
  let filter = null;

  /* the gold pill sits behind the pressed chip; the chip row scrolls sideways on a phone, never the page */
  const pill = (move = true) => {
    const on = $('.jb-chip[aria-pressed="true"]', chips);
    if (!on) return;
    ind.style.transition = move && !still() ? '' : 'none';
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
    if (chips.scrollWidth > chips.clientWidth + 2) {
      const left = on.offsetLeft - (chips.clientWidth - on.offsetWidth) / 2;
      chips.scrollTo({ left: Math.max(0, left), behavior: move && !still() ? 'smooth' : 'auto' });
    }
  };

  const applyFilter = (key, animate = true) => {
    filter = key || null;
    const motion = animate && !still() && 'animate' in Element.prototype;
    let before = null;
    if (motion) {
      cards.forEach(c => { c.getAnimations().forEach(a => a.cancel()); c.classList.remove('jb-out'); c.style.removeProperty('left'); c.style.removeProperty('top'); c.style.removeProperty('width'); c.style.removeProperty('height'); });
      before = new Map(cards.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
    }
    cards.forEach(j => { j.hidden = !!filter && j.dataset.country !== filter; });
    $$('[data-country-tile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.countryTile === filter)));
    $$('[data-jb-all]').forEach(b => b.setAttribute('aria-pressed', String(!filter)));
    const wasHidden = line.hidden;
    line.hidden = !filter;
    if (filter) text.textContent = 'Showing jobs in ' + names[filter] + '.';
    pill(animate);
    if (!motion) return;
    if (filter && wasHidden) line.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });

    const g = grid.getBoundingClientRect();
    for (const [c, r] of before) {
      if (c.hidden) {
        /* leaving: held where it stood, on its own layer, while it fades and shrinks away */
        c.classList.add('jb-out');
        Object.assign(c.style, { left: r.left - g.left + 'px', top: r.top - g.top + 'px', width: r.width + 'px', height: r.height + 'px' });
        const a = c.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.86)' }], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
        a.onfinish = () => { a.cancel(); c.classList.remove('jb-out'); ['left', 'top', 'width', 'height'].forEach(p => c.style.removeProperty(p)); };
      } else {
        /* staying: glide from where it was to where it is now */
        const n = c.getBoundingClientRect(), dx = r.left - n.left, dy = r.top - n.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)' });
      }
    }
    let n = 0;
    cards.filter(c => !c.hidden && !before.has(c)).forEach(c => {
      c.animate([{ opacity: 0, transform: 'translateY(18px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 140 + 60 * n++, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    });
  };

  /* a control outside the jobs section takes the reader to the list; one inside it leaves the page where it is */
  const toList = el => { if (!section.contains(el)) section.scrollIntoView(); };

  $$('[data-country-tile]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    history.pushState({ country: b.dataset.countryTile }, '', '#jobs');
    applyFilter(b.dataset.countryTile);
    toList(b);
  }));
  $$('[data-show-all]').forEach(b => b.addEventListener('click', () => {
    if (filter) history.pushState({ country: null }, '', '#jobs');
    applyFilter(null);
    toList(b);
  }));
  addEventListener('popstate', e => applyFilter(e.state?.country ?? null));
  addEventListener('resize', () => pill(false));
  document.fonts?.ready.then(() => pill(false));
  if (history.state?.country) applyFilter(history.state.country, false); else pill(false);
}
