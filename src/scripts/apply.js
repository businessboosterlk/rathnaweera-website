// THE FORM PREVIEW (was site.js section 6: same field names, messages and hooks). It never sends anything: method
// post, no action, submit stopped here, no fetch (bb_pending 1242). Added on top: the stepper, the sliding steps with
// an easing card height, the quiet valid ticks, Next that wakes up and the country chips that mirror the select.
import { docs, readyState } from './ready.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const form = $('[data-apply-form]');

if (form) {
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const F = n => form.elements[n];
  const view = $('[data-ap-view]', form);
  const steps = Object.fromEntries($$('[data-step]', form).map(s => [s.dataset.step, s]));
  const ORDER = { 1: 0, 2: 1, done: 2 };
  const next = $('[data-next]', form);
  let at = '1';

  const go = (k, focus = true) => {
    const from = at, h0 = view.offsetHeight;
    at = k;
    Object.entries(steps).forEach(([n, s]) => { s.hidden = n !== k; });
    form.dataset.at = k;
    if (from !== k && !still && view.animate) {
      const dir = ORDER[k] > ORDER[from] ? 1 : -1;
      view.classList.add('ap-moving');
      const a = view.animate([{ height: h0 + 'px' }, { height: view.offsetHeight + 'px' }], { duration: 480, easing: EASE });
      steps[k].animate([{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: 'none' }], { duration: 480, easing: EASE });
      a.onfinish = a.oncancel = () => view.classList.remove('ap-moving');
    }
    if (focus) (k === 'done' ? steps.done : $('input:not([tabindex="-1"]),select:not([tabindex="-1"]),.ap-chip[aria-pressed="true"]', steps[k]))?.focus({ preventScroll: true });
    if (from !== k && form.getBoundingClientRect().top < 0) form.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
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
    if (!nicOk(F('nic').value)) return fail('2', 'An NIC number has 12 digits. An older one has 9 digits and a V or X.', F('nic'));
    if (!F('consent').checked) return fail('2', 'Tick the box so we may call you.', F('consent'));
    return fail('2', '');
  };

  // Quiet valid ticks, and Next wakes up once step 1 would pass. Next stays pressable so a press shows what is missing.
  const VALID = { full_name: v => !!v.trim(), phone: v => !!mobile(v), nic: v => !!v.trim() && nicOk(v), passport_no: v => !!v.trim() };
  const mark = () => {
    Object.entries(VALID).forEach(([n, ok]) => F(n).parentElement.classList.toggle('ap-valid', ok(F(n).value)));
    next.classList.toggle('ap-awake', VALID.full_name(F('full_name').value) && VALID.phone(F('phone').value));
  };
  form.addEventListener('input', mark);

  // Country chips mirror the select named country_wanted, which stays the field the form reads.
  const sel = F('country_wanted'), chips = $$('[data-ap-chip]', form);
  const syncChips = () => chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.apChip === sel.value)));
  chips.forEach(c => c.addEventListener('click', () => { sel.value = c.dataset.apChip; syncChips(); }));
  sel.addEventListener('change', syncChips);
  sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');

  const carryDocs = () => {
    const have = docs.filter(d => d.checked).map(d => d.value), line = $('[data-docs-line]', form);
    line.hidden = !have.length;
    line.textContent = have.length ? 'From your checklist, you have: ' + have.join(', ') + '.' : '';
  };
  const opt = n => F(n).selectedOptions[0]?.textContent;

  next.disabled = false;
  $('[data-submit]', form).disabled = false;
  next.addEventListener('click', () => { if (step1()) { carryDocs(); go('2'); } });
  $('[data-back]', form).addEventListener('click', () => go('1'));
  $('[data-restart]', form).addEventListener('click', () => { form.reset(); readyState(); $('[data-picked]', form).hidden = true; syncChips(); mark(); go('1'); });

  form.addEventListener('submit', e => {
    e.preventDefault();                                   // staging: nothing leaves this page (bb_pending 1242)
    if (at === '1') { next.click(); return; }             // Enter in a step 1 field means Next, never a hidden submit
    if (!step2() || F('website').value) return;
    const rows = [['Name', F('full_name').value.trim()], ['Mobile', mobile(F('phone').value)], ['Country', opt('country_wanted')], ['Job', opt('job_wanted')],
      ['NIC', F('nic').value.trim() || 'Not given'], ['Passport', F('passport_no').value.trim() || 'Not given'],
      ['Documents', docs.filter(d => d.checked).map(d => d.value).join(', ') || 'None ticked']];
    const dl = $('[data-summary]', form); dl.replaceChildren();
    rows.forEach(([k, v]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = v; dl.append(dt, dd); });
    go('done');
  });

  // "Apply for this job" (a job card) and "Apply with these answers" (the checklist) fill the form before the
  // anchor takes the reader there. Delegated, so cards drawn or moved by another section still hand over.
  document.addEventListener('click', e => {
    const job = e.target.closest?.('[data-apply-job]');
    if (job) {
      F('job_wanted').value = job.dataset.applyJob; F('country_wanted').value = job.dataset.applyCountry; syncChips();
      const p = $('[data-picked]', form); p.hidden = false; p.textContent = 'You picked: ' + opt('job_wanted') + ', ' + opt('country_wanted') + '.';
      if (!steps.done.hidden) go('1', false);
    }
    if (e.target.closest?.('[data-apply-ready]')) { carryDocs(); if (!steps.done.hidden) go('1', false); }
  });

  form.dataset.at = '1';
  mark();
}
