// The shell's behaviour. Two small jobs: the desk bar turns to a soft white blur with a hairline once the page
// scrolls under it, and the phone menu. Opening the menu adds ONE history entry, so Back closes it; a link in the
// menu replaces that entry with its section, so the next Back leaves the section, not a closed menu.
const $ = (s, r = document) => r.querySelector(s);
const head = $('[data-hd]'), top = $('.hd-top');
const menu = $('#menu'), openBtn = $('[data-menu-open]'), closeBtn = $('[data-menu-close]');

/* 1. The bar once something scrolls under it */
if (head) {
  let rest = 0, queued = false;
  const measure = () => { rest = top ? top.getBoundingClientRect().bottom + scrollY : 0; };
  const set = () => { queued = false; head.classList.toggle('hd-scrolled', scrollY > rest + 1); };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(set); } }, { passive: true });
  addEventListener('resize', () => { measure(); set(); });
  measure(); set();
}

/* 2. The phone menu */
if (menu && openBtn && closeBtn) {
  const show = on => {
    menu.hidden = !on;
    document.body.classList.toggle('menu-open', on);
    openBtn.setAttribute('aria-expanded', String(on));
    (on ? closeBtn : openBtn).focus({ preventScroll: true });
  };
  const without = () => { const { menu: _m, ...rest } = history.state || {}; return rest; };
  if (history.state?.menu) history.replaceState(without(), '');          // a reload never strands a menu entry
  openBtn.addEventListener('click', () => { history.pushState({ ...(history.state || {}), menu: true }, ''); show(true); });
  closeBtn.addEventListener('click', () => history.back());
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) history.back(); });
  menu.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const hash = a.getAttribute('href');
    history.replaceState(without(), '', hash);
    show(false);
    $(hash)?.scrollIntoView();
  }));
  addEventListener('popstate', e => { if (!menu.hidden && !e.state?.menu) show(false); });
  matchMedia('(min-width: 1100px)').addEventListener('change', m => { if (m.matches && !menu.hidden) history.back(); });
}
