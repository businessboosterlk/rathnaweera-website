// QUESTIONS PEOPLE ASK. The details elements work on their own; this only eases the answer's height open and shut.
// Reduced motion: the browser's own instant toggle.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  document.querySelectorAll('[data-fq] details').forEach(d => {
    const sum = d.querySelector('summary'), body = d.querySelector('.fq-a');
    let anim = null;
    sum.addEventListener('click', e => {
      e.preventDefault();
      const from = body.offsetHeight;
      anim?.cancel();
      const closing = d.open && !d.classList.contains('fq-closing');
      if (closing) {
        d.classList.add('fq-closing');
        anim = body.animate([{ height: from + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: EASE });
        anim.onfinish = () => { d.open = false; d.classList.remove('fq-closing'); anim = null; };
      } else {
        d.classList.remove('fq-closing');
        d.open = true;
        const to = body.scrollHeight;
        anim = body.animate([{ height: (from || 0) + 'px', opacity: from ? 1 : 0 }, { height: to + 'px', opacity: 1 }], { duration: 480, easing: EASE });
        anim.onfinish = () => { anim = null; };
      }
    });
  });
}
