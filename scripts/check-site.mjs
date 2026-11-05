#!/usr/bin/env node
/* THE CLICK PATH for the Rathnaweera home page (skill bb-click-path). Every touchpoint on the page is COUNTED from the
   page, PRESSED in a real browser at phone (390, touch) and desk (1440) and its effect READ. After every link, the menu,
   the country filter, the map's See jobs and the form: Back once undoes exactly one thing, Back twice leaves the page.
   Then the motion is read (globe, plane, map card, stages, progress line, headings, ticker, wipes, seal, footer name),
   the same page with reduced motion, the same page with JavaScript off, and NOTHING CUT OFF (clipAudit) at 375, 390,
   768 and 1440 with the menu, a map card and every form step open, and no sideways scroll.
   The count is done by a recorder in the page, never by hand: a touchpoint the run did not press is named and fails.
     npx astro preview --port 4662 --host 127.0.0.1 &
     node scripts/check-site.mjs [url]       default http://127.0.0.1:4662/rathnaweera-website/
   Links to another site (the SLBFE register) are checked by their attributes and counted apart, never opened.
   Rebuilt 5 Nov 2026 for the page made of components: every old check kept, new hooks pressed. */
import { existsSync } from 'node:fs';
let { chromium } = await import('playwright');
/* the repo's Playwright needs its own browser download; the machine's shared copy is used when that is missing */
if (!existsSync(chromium.executablePath())) ({ chromium } = await import(`${process.env.HOME}/bb-systems/batch/node_modules/playwright/index.mjs`));

const { clipAudit } = await import(`${process.env.HOME}/bb-systems/qa/clip.mjs`);
const { measure } = await import(`${process.env.HOME}/bb-systems/qa/optical.mjs`);
const URL0 = process.argv[2] || 'http://127.0.0.1:4662/rathnaweera-website/';
const ORIGIN = new URL(URL0).origin;
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen && !pass ? '   ' + String(seen).slice(0, 600) : '')); };
const browser = await chromium.launch();
const wait = ms => new Promise(r => setTimeout(r, ms));

/* runs before the page's own script: names every touchpoint and hears every real press */
const INSTALL = () => {
  const MAP = '[data-wm-shape],[data-wm-pin],[data-wm-sea]';
  const TOUCH = 'a[href],button,summary,select,input:not([type=hidden]):not([tabindex="-1"]),textarea,' + MAP;
  const where = e => e.closest('#menu') ? 'menu' : e.closest('.phonebar') ? 'phone bar' : e.closest('.topline') ? 'top line' : e.closest('.site-head') ? 'header' : e.closest('footer') ? 'footer'
    : e.closest('.ts') ? 'trust strip' : e.closest('[data-hero]') ? 'hero' : (e.closest('section[id]')?.id || 'page');
  const what = e => {
    if (e.matches('input,select,textarea')) return 'field ' + (e.name + (e.type === 'checkbox' ? ' ' + e.value : ''));
    if (e.tagName === 'SUMMARY') return 'answer "' + e.textContent.trim().slice(0, 30) + '"';
    for (const k of ['applyJob', 'countryTile', 'wmCountry', 'wmShape', 'wmPin', 'stTab']) if (e.dataset[k]) return k + ' ' + e.dataset[k];
    if ('apChip' in e.dataset) return 'apChip ' + (e.dataset.apChip || 'any');
    if ('wmClose' in e.dataset) return 'wmClose ' + e.closest('[data-wm-card]')?.dataset.wmCard;
    for (const k of ['menuOpen', 'menuClose', 'jbAll', 'showAll', 'applyReady', 'next', 'back', 'submit', 'restart', 'wmSea', 'stPrev', 'stNext', 'stPlay']) if (k in e.dataset) return k;
    if (e.tagName === 'A') return (e.target === '_blank' ? 'external ' : 'to ') + e.getAttribute('href').slice(0, 40);
    return 'UNNAMED ' + e.outerHTML.slice(0, 60);
  };
  /* a point inside the element where a press lands on the element itself, inside the screen and the map, clear of the
     sticky header and the phone bar; null when something else covers all of it */
  window.__spot = e => {
    const r = e.getBoundingClientRect(), box = e.closest('[data-wm-stage]')?.getBoundingClientRect() || { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const head = document.querySelector('.site-head'), hb = head && getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().bottom : 0;
    const bar = document.querySelector('.phonebar'), bt = bar && bar.offsetParent !== null ? bar.getBoundingClientRect().top : innerHeight;
    const L = Math.max(r.left, box.left, 0) + 2, T = Math.max(r.top, box.top, hb, 0) + 2, Rr = Math.min(r.right, box.right, innerWidth) - 2, B = Math.min(r.bottom, box.bottom, bt, innerHeight) - 2;
    if (Rr <= L || B <= T) return null;
    for (let gy = 0; gy <= 20; gy++) for (let gx = 0; gx <= 20; gx++) {
      const x = L + (Rr - L) * ((gx * 7) % 21) / 20, y = T + (B - T) * ((gy * 13) % 21) / 20;
      const on = (x, y) => { const h = document.elementFromPoint(x, y); return h && (h === e || e.contains(h)); };
      if ([[0, 0], [-4, 0], [4, 0], [0, -4], [0, 4]].every(([dx, dy]) => on(x + dx, y + dy))) return [Math.round(x), Math.round(y)];   /* room for a fingertip */
    }
    return null;
  };
  /* shown: not hidden, not inert, a real size, not see-through. Opacity set by the reveal (data-reveal) does not count,
     it only waits for a scroll; a tick box drawn over by its own label counts as its label. Map parts are counted only
     where a press can reach them (a country smaller than its own pin cannot be pressed) */
  window.__vis = e => {
    if (e.disabled) return false;
    const map = e.matches(MAP);
    if (e.closest('[hidden],[inert]') || (!map && e.closest('[aria-hidden="true"]'))) return false;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
    if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true })) return false;
    const probe = e.matches('input[type=checkbox],input[type=radio]') && getComputedStyle(e).opacity === '0' ? e.closest('label') || e : e;
    for (let n = probe; n && n !== document.documentElement; n = n.parentElement) if (!n.hasAttribute('data-reveal') && getComputedStyle(n).opacity === '0') return false;
    if (map) { const keep = scrollY; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const s = window.__spot(e); scrollTo({ left: scrollX, top: keep, behavior: 'instant' }); return !!s; }
    return true;
  };
  window.__kind = e => where(e) + ': ' + what(e);
  window.__touchpoints = () => [...new Set([...document.querySelectorAll(TOUCH)].filter(window.__vis).map(window.__kind))];
  const hear = ev => { const t = ev.target instanceof Element ? ev.target.closest(TOUCH) : null; if (!t) return; const k = window.__kind(t); const p = JSON.parse(sessionStorage.getItem('__pressed') || '[]'); if (!p.includes(k)) { p.push(k); sessionStorage.setItem('__pressed', JSON.stringify(p)); } };
  document.addEventListener('click', hear, true); document.addEventListener('change', hear, true); document.addEventListener('input', hear, true);
};

/* the end state of every reveal at once, for counting and for the cut off audit (the page's own fallback class, and every
   entrance that has an end jumped to it; the ticker and the globe never end and keep running) */
const ENDSTATE = () => { document.getAnimations().forEach(a => { if (isFinite(a.effect?.getComputedTiming().endTime)) a.finish(); }); document.documentElement.classList.add('reveal-all'); const s = document.createElement('style'); s.dataset.cp = 'end'; s.textContent = '*,*::before,*::after{transition:none!important}'; document.head.append(s); };
const matrixA = t => t === 'none' ? 1 : +t.replace(/^matrix\(/, '').split(',')[0];

const SIZES = [['phone', { width: 390, height: 844 }, true], ['desk', { width: 1440, height: 900 }, false]];
const allRequests = [];
for (const [size, viewport, touch] of SIZES) {
  console.log(`\n${size} ${viewport.width}x${viewport.height}`);
  const ctx = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1 });
  await ctx.addInitScript(INSTALL);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  const posts = []; page.on('request', r => { const bad = r.method() !== 'GET' || !r.url().startsWith(ORIGIN); if (bad) { posts.push(r.method() + ' ' + r.url()); allRequests.push(size + ' ' + r.method() + ' ' + r.url()); } });
  /* a visitor presses once the hero has arrived: the entrance (hero-in, up to about 2s) is waited out, capped at 4s, so
     the hero buttons are on screen when the touchpoints are listed */
  const fresh = async () => { await page.goto('about:blank'); await page.goto(URL0, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter(a => isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished.catch(() => 0))), new Promise(r => setTimeout(r, 4000))])); };
  const settle = async () => { let y = -1; for (let i = 0; i < 30; i++) { await page.waitForTimeout(60); const n = await page.evaluate(() => scrollY); if (n === y) break; y = n; } };
  /* html has scroll-behavior smooth, so the browser's own scroll into view would still be gliding when the press
     lands; the element is brought to the middle of the screen at once, as a thumb would find it */
  const bring = async l => { await l.evaluate(e => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })); await page.waitForTimeout(80); };
  const press = async sel => { const l = page.locator(sel).first(); await bring(l); touch ? await l.tap() : await l.click(); await settle(); };
  const tapAt = async ([x, y]) => { touch ? await page.touchscreen.tap(x, y) : await page.mouse.click(x, y); await settle(); };
  const back = async () => { await page.evaluate(() => history.back()).catch(() => {}); await page.waitForTimeout(350); await settle().catch(() => {}); };
  const left = () => page.url() === 'about:blank';
  const st = () => page.evaluate(() => ({ hash: location.hash, menu: !document.querySelector('#menu').hidden,
    filter: document.querySelector('[data-filter-line]').hidden ? '' : document.querySelector('[data-filter-text]').textContent,
    jobs: [...document.querySelectorAll('.jobs .job')].filter(j => !j.hidden).map(j => j.dataset.country),
    step: [...document.querySelectorAll('[data-step]')].find(s => !s.hidden)?.dataset.step }));
  /* the target's first heading sits below the sticky header and inside the screen */
  const landed = hash => page.evaluate(h => { const t = document.querySelector(h);
    if (!t && h !== '#top') return 'no target';
    if (h === '#top') return !t && scrollY < 2 ? 'ok' : `back to top left the page at ${Math.round(scrollY)}px`;   /* back to top means the very top, top line showing */
    const head = document.querySelector('.site-head'); const hb = getComputedStyle(head).position === 'sticky' ? head.getBoundingClientRect().bottom : 0; const el = t.querySelector('h1,h2') || t; const r = el.getBoundingClientRect(); return r.top >= hb - 1 && r.top < innerHeight * 0.6 ? 'ok' : `heading top ${Math.round(r.top)}, header bottom ${Math.round(hb)}`; }, hash);

  await fresh();
  await page.evaluate(() => sessionStorage.removeItem('__pressed'));
  ok(`${size}: no console errors on load`, !errors.length, errors.join(' | '));
  if (touch) {
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.phonebar')).backgroundColor);
    ok(`${size}: the Call and Apply bar is solid, nothing shows through it`, /^rgb\(/.test(bg), bg);   /* rgba() means the hero's Apply ghosted through it on the iPhone */
  }

  /* ALL: every touchpoint visible in any state of the page (menu open, the filter line, each map card, each form step) */
  const all = new Set();
  const gather = async () => (await page.evaluate(() => window.__touchpoints())).forEach(k => all.add(k));
  await page.evaluate(ENDSTATE); await gather();
  if (touch) { await press('[data-menu-open]'); await gather(); await fresh(); await page.evaluate(ENDSTATE); }
  await page.evaluate(() => { document.querySelector('[data-filter-line]').hidden = false; document.querySelectorAll('[data-wm-card]').forEach(c => { c.hidden = false; }); }); await gather();
  await page.evaluate(() => { document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== '2'; }); }); await gather();
  await page.evaluate(() => { document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== 'done'; }); }); await gather();
  await fresh();
  await page.evaluate(() => sessionStorage.removeItem('__pressed'));

  /* 1. every link inside the page, from a fresh load: lands, Back once returns, Back twice leaves */
  const pickAnchors = () => [...document.querySelectorAll('a[href^="#"]')].filter(a => window.__vis(a) && !a.closest('#menu') && !a.matches('[data-apply-job],[data-apply-ready],[data-country-tile]'));
  const anchors = await page.evaluate(`(${pickAnchors})().map((a, i) => ['a' + i, a.getAttribute('href'), window.__kind(a)])`);
  for (const [id, href, kind] of anchors) {
    await fresh();
    await page.evaluate(`(${pickAnchors})()[${+id.slice(1)}].dataset.cp = '${id}'`);
    await press(`[data-cp="${id}"]`);
    const h = await page.evaluate(() => location.hash), where = await landed(href);
    await back(); const b1 = await page.evaluate(() => location.hash); await back();
    ok(`${size}: ${kind} lands, Back once returns, Back twice leaves`, h === href && where === 'ok' && b1 === '' && left(), `hash ${h}, ${where}, after one Back "${b1}", left ${left()}`);
  }

  /* 2. the phone menu */
  if (touch) {
    await fresh(); await press('[data-menu-open]');
    const open = await st(), exp = await page.getAttribute('[data-menu-open]', 'aria-expanded');
    await back(); const b1 = await st(); await back();
    ok(`${size}: Menu opens, Back once closes it, Back twice leaves`, open.menu && exp === 'true' && !b1.menu && b1.hash === '' && left(), JSON.stringify({ open, b1, left: left() }));
    await fresh(); await press('[data-menu-open]'); await press('[data-menu-close]'); const c = await st(); await back();
    ok(`${size}: Close shuts the menu and the next Back leaves`, !c.menu && left(), JSON.stringify(c));
    await fresh(); await press('[data-menu-open]'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    ok(`${size}: Escape shuts the menu`, !(await st()).menu);
    for (const href of await page.evaluate(() => [...document.querySelectorAll('#menu a')].map(a => a.getAttribute('href')))) {
      await fresh(); await press('[data-menu-open]'); await press(`#menu a[href="${href}"]`);
      const s = await st(), where = await landed(href); await back(); const b1 = await st(); await back();
      ok(`${size}: menu link ${href} closes the menu and lands, Back once returns, Back twice leaves`, !s.menu && s.hash === href && where === 'ok' && b1.hash === '' && !b1.menu && left(), JSON.stringify({ s, where, b1, left: left() }));
    }
  }

  /* 3. countries filter the jobs; Back undoes one choice */
  await fresh();
  const tiles = await page.evaluate(() => [...document.querySelectorAll('#jobs [data-country-tile]')].map(b => b.dataset.countryTile));
  ok(`${size}: six country chips above the jobs (${tiles.length})`, tiles.length === 6);
  for (const t of tiles) {
    await fresh(); await press(`#jobs [data-country-tile="${t}"]`);
    const s = await st(), pressed = await page.getAttribute(`#jobs [data-country-tile="${t}"]`, 'aria-pressed'), allOff = await page.getAttribute('[data-jb-all]', 'aria-pressed');
    await back(); const b1 = await st(); await back();
    ok(`${size}: country ${t} shows only its jobs, Back once shows all, Back twice leaves`, s.filter && s.jobs.length >= 1 && s.jobs.every(c => c === t) && pressed === 'true' && allOff === 'false' && !b1.filter && b1.jobs.length === 6 && left(), JSON.stringify({ s, pressed, allOff, b1, left: left() }));
  }
  await fresh(); await press(`#jobs [data-country-tile="${tiles[0]}"]`); await press(`#jobs [data-country-tile="${tiles[1]}"]`); await back();
  ok(`${size}: two countries in a row, Back returns to the first`, (await st()).jobs.every(c => c === tiles[0]));
  for (const [where, name] of [['.filter-line [data-show-all]', 'Show all'], ['.section-head [data-show-all]', 'See all jobs'], ['[data-jb-all]', 'the All jobs chip']]) {
    await fresh(); await press(`#jobs [data-country-tile="${tiles[0]}"]`); await press(where);
    const s = await st(); await back(); const b1 = await st();
    ok(`${size}: ${name} clears the filter, Back brings it back`, !s.filter && s.jobs.length === 6 && b1.jobs.every(c => c === tiles[0]) && b1.filter, JSON.stringify({ s, b1 }));
  }

  /* 4. Am I ready to apply? */
  await fresh();
  await press('.checklist input[value="Passport"]');
  const one = await page.evaluate(() => [document.querySelector('[data-ready-title]').textContent, document.querySelector('[data-ready-list]').textContent, document.querySelector('[data-rd-count]').textContent]);
  ok(`${size}: ticking Passport leaves four things, Passport off the list, the ring says 1`, one[0] === 'You still need four things' && !one[1].includes('Passport') && one[2] === '1', one.join(' / '));
  for (const v of await page.evaluate(() => [...document.querySelectorAll('.checklist input')].slice(1).map(i => i.value))) await press(`.checklist input[value="${v}"]`);
  ok(`${size}: ticking all five says every document, the ring says 5`, (await page.textContent('[data-ready-title]')) === 'You have every document on this list' && (await page.textContent('[data-rd-count]')) === '5');
  await press('[data-apply-ready]');
  ok(`${size}: Apply with these answers goes to the form`, (await st()).hash === '#apply');

  /* 5. Apply for this job fills the form */
  for (const j of await page.evaluate(() => [...document.querySelectorAll('[data-apply-job]')].map(a => [a.dataset.applyJob, a.dataset.applyCountry]))) {
    await fresh(); await press(`[data-apply-job="${j[0]}"]`);
    const v = await page.evaluate(() => [location.hash, document.querySelector('[name=job_wanted]').value, document.querySelector('[name=country_wanted]').value, document.querySelector('[data-picked]').hidden ? '' : document.querySelector('[data-picked]').textContent, document.querySelector('[data-ap-chip][aria-pressed="true"]')?.dataset.apChip]);
    ok(`${size}: Apply for this job (${j[0]}) lands on the form with job and country picked`, v[0] === '#apply' && v[1] === j[0] && v[2] === j[1] && v[3].startsWith('You picked:') && v[4] === j[1], v.join(' / '));
  }

  /* 6. the form preview: checks, two steps, the country chips, a summary, nothing sent */
  await fresh(); posts.length = 0;
  await press('.checklist input[value="Passport"]');
  await bring(page.locator('#apply'));
  const err = async n => page.evaluate(n => { const e = document.querySelector(`[data-err="${n}"]`); return e.hidden ? '' : e.textContent; }, n);
  await press('[data-next]'); ok(`${size}: Next with no name asks for the name`, (await err('1')).includes('full name'));
  await page.fill('[name=full_name]', 'Test Person'); await page.fill('[name=phone]', '12345'); await press('[data-next]');
  ok(`${size}: a wrong mobile number is refused`, (await err('1')).includes('07'));
  await page.fill('[name=phone]', '+94 77 123 4567'); await press('[data-next]');
  const s2 = await st(), docs = await page.evaluate(() => document.querySelector('[data-docs-line]').textContent);
  ok(`${size}: Next goes to step 2 and carries the ticked documents`, s2.step === '2' && docs.includes('Passport'), JSON.stringify(s2) + ' ' + docs);
  await press('[data-back]');
  ok(`${size}: Back to step 1 keeps what was typed`, (await st()).step === '1' && (await page.inputValue('[name=full_name]')) === 'Test Person');
  await press('[data-next]');
  const chips = await page.evaluate(() => [...document.querySelectorAll('[data-ap-chip]')].map(c => c.dataset.apChip));
  const mirror = [];
  for (const c of [...chips.slice(1), chips[0], 'kuwait']) {
    await press(`[data-ap-chip="${c}"]`);
    const m = await page.evaluate(c => [document.querySelector('[name=country_wanted]').value, [...document.querySelectorAll('[data-ap-chip][aria-pressed="true"]')].map(b => b.dataset.apChip).join()], c);
    if (m[0] !== c || m[1] !== c) mirror.push(`${c || 'any'}: select ${m[0] || 'any'}, pressed ${m[1]}`);
  }
  ok(`${size}: each of the ${chips.length} country chips picks its country in the form and only it is pressed`, chips.length === 7 && !mirror.length, mirror.join(' | '));
  await page.selectOption('[name=job_wanted]', { index: 1 });
  await page.fill('[name=nic]', '123'); await press('[data-submit]');
  ok(`${size}: a wrong NIC number is refused`, (await err('2')).includes('NIC number'));
  await page.fill('[name=nic]', ''); await page.fill('[name=passport_no]', 'N1234567'); await press('[data-submit]');
  ok(`${size}: no consent tick, no summary`, (await err('2')).includes('Tick') && (await st()).step === '2');
  await press('[name=consent]'); await press('[data-submit]');
  const sum = await page.evaluate(() => [...document.querySelectorAll('[data-summary] dd')].map(d => d.textContent));
  ok(`${size}: Send shows the summary with seven answers and the mobile in 07 form`, (await st()).step === 'done' && sum.length === 7 && sum[1] === '0771234567' && sum[2] === 'Kuwait', sum.join(' | '));
  ok(`${size}: the form sent nothing anywhere`, !posts.length && new URL(page.url()).pathname === new URL(URL0).pathname, posts.join(' | '));
  await press('[data-restart]');
  ok(`${size}: Start again empties the form and returns to step 1`, (await st()).step === '1' && (await page.inputValue('[name=full_name]')) === '' && (await page.evaluate(() => document.querySelector('[data-ap-chip][aria-pressed="true"]')?.dataset.apChip)) === '');

  /* 7. every answer opens and closes */
  await fresh();
  const faqs = await page.evaluate(() => [...document.querySelectorAll('#faq summary')].filter(window.__vis).length);
  let toggled = 0;
  for (let i = 0; i < faqs; i++) {
    const isOpen = () => page.evaluate(i => [...document.querySelectorAll('#faq details')].filter(d => window.__vis(d.querySelector('summary')))[i].open, i);
    await page.evaluate(i => { [...document.querySelectorAll('#faq summary')].filter(window.__vis)[i].dataset.cp = 'faq' + i; }, i);
    const l = page.locator(`[data-cp="faq${i}"]`); let flips = 0;
    for (let n = 0; n < 2; n++) { const before = await isOpen(); await bring(l); touch ? await l.tap() : await l.click(); await page.waitForTimeout(650); if ((await isOpen()) !== before) flips++; }
    if (flips === 2) toggled++;
  }
  ok(`${size}: every answer opens and closes (${toggled} of ${faqs}, ${touch ? 'six on a phone' : 'eight on a desk'})`, toggled === faqs && faqs === (touch ? 6 : 8));

  /* 8. links to another site: checked, never opened */
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[target=_blank]')].map(a => [a.href, a.rel, window.__vis(a)]));
  ok(`${size}: ${ext.filter(e => e[2]).length} Check it links open the SLBFE register in a new tab, noopener (${ext.length} in the page)`, ext.filter(e => e[2]).length >= 3 && ext.every(([h, r]) => h.startsWith('https://applications.slbfe.lk/') && r.includes('noopener')), JSON.stringify(ext));

  /* 9. THE MAP. A country (its button, its pin or its shape) opens its card inside the map's box; the card closes on its
     cross, on Escape, on the sea and on a scroll; another country swaps it; See jobs is ONE history entry */
  const card = () => page.evaluate(() => { const st = document.querySelector('[data-wm-stage]').getBoundingClientRect();
    const open = [...document.querySelectorAll('[data-wm-card]')].filter(c => !c.hidden);
    return { open: open.map(c => c.dataset.wmCard), inside: open.map(c => { const r = c.getBoundingClientRect(); return r.left >= st.left - 0.5 && r.right <= st.right + 0.5 && r.top >= st.top - 0.5 && r.bottom <= st.bottom + 0.5 ? 'in' : `card ${[r.left, r.top, r.right, r.bottom].map(Math.round)} map ${[st.left, st.top, st.right, st.bottom].map(Math.round)}`; }),
      expanded: [...document.querySelectorAll('[data-wm-country][aria-expanded="true"]')].map(b => b.dataset.wmCountry) }; });
  const toMap = async () => { await page.evaluate(() => document.querySelector('[data-wm-stage]').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(900); await settle(); };
  /* the map's camera glides for about a second after every open and close: a spot is read only once it holds still */
  const spot = async sel => { let a = '', b = '-'; for (let i = 0; i < 20 && a !== b; i++) { a = b; await page.waitForTimeout(150); b = await page.evaluate(sel => JSON.stringify(document.querySelector(sel)?.getBoundingClientRect()), sel); }
    return page.evaluate(sel => { const e = document.querySelector(sel); return e ? window.__spot(e) : null; }, sel); };
  await fresh(); await toMap();
  const keys = await page.evaluate(() => [...document.querySelectorAll('[data-wm-country]')].map(b => b.dataset.wmCountry));
  for (const k of keys) {
    await press(`[data-wm-country="${k}"]`); await page.waitForTimeout(1400);
    const a = await card();
    await press(`[data-wm-card="${k}"] [data-wm-close]`); await page.waitForTimeout(600);
    const b = await card();
    ok(`${size}: map button ${k} opens its card inside the map, its cross closes it`, a.open.join() === k && a.inside[0] === 'in' && a.expanded.join() === k && !b.open.length && !b.expanded.length, JSON.stringify({ a, b }));
  }
  /* a pin or shape with a fingertip of free room in the world view is pressed there; a Gulf pin or shape the others
     cover is pressed once the map has closed up on a neighbour (its card then swaps). Only a part that no view of the
     map lets a finger reach fails: that is a touchpoint nobody can press */
  const reach = async sel => {
    await toMap(); let p = await spot(sel), via = '';
    for (const n of keys) { if (p) break; if (sel.includes(`"${n}"`)) continue; await press(`[data-wm-country="${n}"]`); await page.waitForTimeout(1400); p = await spot(sel); via = n; if (!p) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); } }
    return [p, via];
  };
  for (const k of keys) {
    const [p, via] = await reach(`[data-wm-pin="${k}"]`);
    if (!p) { ok(`${size}: map pin ${k} can be pressed in some view of the map`, false, 'no view leaves a fingertip of it free'); continue; }
    await tapAt(p); await page.waitForTimeout(1400); const a = await card();
    await page.keyboard.press('Escape'); await page.waitForTimeout(600); const b = await card();
    ok(`${size}: map pin ${k}${via ? ` (from ${via}'s close up, which it swaps)` : ''} opens its card inside the map, Escape closes it`, a.open.join() === k && a.inside[0] === 'in' && !b.open.length, JSON.stringify({ a, b }));
  }
  /* a country's shape: from the world view when it is big enough to press, else from a neighbour's close up; the
     neighbour's card then swaps for this one. A shape smaller than its own pin is pressed by its pin, above */
  const shapeKeys = await page.evaluate(() => [...document.querySelectorAll('[data-wm-shape]')].map(s => s.dataset.wmShape));
  let shapesPressed = 0; const noShape = [];
  for (const k of shapeKeys) {
    const [p, via] = await reach(`[data-wm-shape="${k}"]`);
    if (!p) { noShape.push(k); continue; }
    await tapAt(p); await page.waitForTimeout(1400); const a = await card();
    const sea = await spot('[data-wm-sea]'); if (sea) await tapAt(sea); await page.waitForTimeout(600); const b = await card();
    shapesPressed++;
    ok(`${size}: map shape ${k}${via ? ` (from ${via}'s close up, which it swaps)` : ''} opens its card inside the map, the sea closes it`, a.open.join() === k && a.inside[0] === 'in' && sea && !b.open.length, JSON.stringify({ a, sea, b }));
  }
  /* a country smaller than a fingertip (Bahrain is about 1 by 3 px) is geography, not a fault: it opens from its chip and its pin */
  ok(`${size}: every country shape a finger can reach was pressed (${shapesPressed} of ${shapeKeys.length}${noShape.length ? ', smaller than a fingertip in every view: ' + noShape.join(', ') : ''})`, shapesPressed + noShape.length === shapeKeys.length);
  await toMap(); await press(`[data-wm-country="${keys[0]}"]`); await page.waitForTimeout(1400); await press(`[data-wm-country="${keys[1]}"]`); await page.waitForTimeout(1400);
  const sw = await card();
  ok(`${size}: pressing another country swaps the card`, sw.open.join() === keys[1] && sw.inside[0] === 'in' && sw.expanded.join() === keys[1], JSON.stringify(sw));
  const before = await page.evaluate(() => scrollY); await page.evaluate(() => scrollBy({ left: 0, top: Math.round(innerHeight * 0.5), behavior: 'instant' })); await page.waitForTimeout(900);
  const sc = await card();
  ok(`${size}: a scroll away closes the card`, !sc.open.length && (await page.evaluate(() => scrollY)) > before, JSON.stringify(sc));
  for (const k of keys) {
    await fresh(); await toMap(); await press(`[data-wm-country="${k}"]`); await page.waitForTimeout(1400);
    const h0 = await page.evaluate(() => history.length);
    /* a card that never shows its link is a FAIL with its reason, never a crash that hides every later check */
    try { await press(`[data-wm-card="${k}"] [data-country-tile]`); } catch (e) { ok(`${size}: See jobs in ${k} can be pressed once its card is open`, false, String(e.message).split('\n')[0]); continue; }
    await page.waitForTimeout(400);
    const h1 = await page.evaluate(() => history.length), s = await st(), seen = await page.evaluate(() => { const r = document.querySelector('#jobs').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    await back(); const b1 = await st(); await back();
    /* a tab keeps at most 50 entries, so after the long walk the count is read only while there is room; Back once
       undoing the filter and Back twice leaving prove exactly one entry either way */
    ok(`${size}: See jobs in ${k} adds one history entry, shows only its jobs, Back once undoes it, Back twice leaves`, (h0 >= 50 || h1 - h0 === 1) && s.hash === '#jobs' && seen && s.filter && s.jobs.length >= 1 && s.jobs.every(c => c === k) && !b1.filter && b1.jobs.length === 6 && left(), JSON.stringify({ entries: h0 >= 50 ? 'history full at 50' : h1 - h0, s, seen, b1, left: left() }));
  }

  /* 10. THE STAGES play by themselves in view, stop for good once a tab is pressed; prev, next, play; each tab its panel */
  await fresh();
  const stg = () => page.evaluate(() => ({ where: document.querySelector('[data-st-where]').textContent, playing: document.querySelector('[data-st]').classList.contains('is-playing'),
    on: [...document.querySelectorAll('[data-st-panel]')].filter(p => p.classList.contains('is-on')).map(p => p.dataset.stPanel),
    shown: [...document.querySelectorAll('[data-st-panel]')].filter(p => p.checkVisibility({ opacityProperty: true, visibilityProperty: true })).map(p => p.dataset.stPanel),
    sel: [...document.querySelectorAll('[data-st-tab][aria-selected="true"]')].map(t => t.dataset.stTab) }));
  await page.evaluate(() => document.querySelector('[data-st-stage]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  const s0 = await stg(); let auto = s0;
  for (let i = 0; i < 40 && auto.where === s0.where; i++) { await page.waitForTimeout(250); auto = await stg(); }
  ok(`${size}: the stages advance by themselves while in view`, s0.playing && auto.where !== s0.where, JSON.stringify({ s0, auto }));
  await press('[data-st-tab="2"]'); const t2 = await stg(); await page.waitForTimeout(6000); const t2b = await stg();
  ok(`${size}: pressing a stage stops the play for good`, t2.where === '3' && !t2.playing && t2b.where === '3' && !t2b.playing, JSON.stringify({ t2, t2b }));
  await press('[data-st-next]'); const nx = await stg(); await press('[data-st-prev]'); const pv = await stg();
  ok(`${size}: next and prev move one stage each way`, nx.where === '4' && pv.where === '3', JSON.stringify({ nx, pv }));
  await press('[data-st-tab="0"]'); await press('[data-st-prev]'); const wrap = await stg();
  ok(`${size}: prev from the first stage goes to the last`, wrap.where === '7', JSON.stringify(wrap));
  const tabsBad = [];
  for (let i = 0; i < 7; i++) { await press(`[data-st-tab="${i}"]`); await page.waitForTimeout(700); const s = await stg(); if (s.where !== String(i + 1) || s.on.join() !== String(i) || s.shown.join() !== String(i) || s.sel.join() !== String(i)) tabsBad.push(`${i}: ${JSON.stringify(s)}`); }
  ok(`${size}: each of the seven tabs shows its own panel and only it`, !tabsBad.length, tabsBad.join(' | '));
  await press('[data-st-play]'); const pl = await stg(); let pl2 = pl;
  for (let i = 0; i < 40 && pl2.where === pl.where; i++) { await page.waitForTimeout(250); pl2 = await stg(); }
  const label = await page.getAttribute('[data-st-play]', 'aria-label');
  await press('[data-st-play]'); const ps = await stg();
  ok(`${size}: play starts the stages again and pause stops them`, pl.playing && label === 'Pause the stages' && pl2.where !== pl.where && !ps.playing, JSON.stringify({ pl, pl2, label, ps }));

  /* 11. THE MOTION, read on a fresh load */
  await fresh();
  /* the globe turns by itself: the globe alone (rings, plane and ground hidden for the reading) differs a second later */
  const globe = async () => {
    await page.waitForFunction(() => document.querySelector('.hero-globe')?.matches('.gl-on,.no-gl'), null, { timeout: 8000 }).catch(() => {});
    const mode = await page.evaluate(() => document.querySelector('.hero-globe').className);
    await page.evaluate(() => { const s = document.createElement('style'); s.dataset.cp = 'globe'; s.textContent = '.hero-ring,.hero-plane,.hero-ground{visibility:hidden!important}'; document.head.append(s); scrollTo({ left: 0, top: 0, behavior: 'instant' }); });
    const g = page.locator('.hero-globe'); const a = await g.screenshot({ timeout: 20000 }); await page.waitForTimeout(1000); const b = await g.screenshot({ timeout: 20000 });
    await page.evaluate(() => document.querySelector('style[data-cp=globe]').remove());
    return { mode, same: a.equals(b), size: a.length };
  };
  const gl = await globe();
  ok(`${size}: the globe turns by itself (${gl.mode})`, /gl-on|no-gl/.test(gl.mode) && !gl.same, JSON.stringify(gl));
  /* the plane rests until the page scrolls, then flies */
  const plane = () => page.evaluate(() => { const a = document.querySelector('[data-hero-art]').getBoundingClientRect(), p = document.querySelector('.hero-plane').getBoundingClientRect(); return [p.left - a.left, p.top - a.top, p.width]; });
  await page.evaluate(() => scrollTo({ left: 0, top: 0, behavior: 'instant' })); await page.waitForTimeout(300);
  const p0 = await plane(); await page.waitForTimeout(1500); const p1 = await plane();
  await page.evaluate(() => scrollTo({ left: 0, top: 300, behavior: 'instant' })); await page.waitForTimeout(1200); const p2 = await plane();
  const moved = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  ok(`${size}: the plane rests until the page scrolls`, moved(p0, p1) < 0.5, JSON.stringify({ p0, p1 }));
  ok(`${size}: the plane flies when the page scrolls (${moved(p0, p2).toFixed(1)}px)`, moved(p0, p2) > 2, JSON.stringify({ p0, p2 }));
  /* the gold progress line: empty at the top, full at the foot */
  const prog = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-progress]')).transform);
  await page.evaluate(() => scrollTo({ left: 0, top: 0, behavior: 'instant' })); await page.waitForTimeout(300); const pTop = matrixA(await prog());
  await page.evaluate(() => scrollTo({ left: 0, top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(400); const pEnd = matrixA(await prog());
  ok(`${size}: the progress line reads ${pTop.toFixed(3)} at the top and ${pEnd.toFixed(3)} at the foot`, pTop <= 0.01 && pEnd >= 0.99);
  /* the hero heading: centred on a phone (every line within 1.5px of the screen's centre); on a desk the brand mark
     starts on the same x as the heading */
  await page.evaluate(() => scrollTo({ left: 0, top: 0, behavior: 'instant' })); await page.waitForTimeout(200);
  if (touch) {
    const lines = await page.evaluate(() => { const g = document.createRange(); g.selectNodeContents(document.querySelector('#hero-h')); const by = new Map();
      for (const q of g.getClientRects()) { if (q.width < 1) continue; const k = Math.round(q.bottom); const o = by.get(k) || [Infinity, -Infinity]; by.set(k, [Math.min(o[0], q.left), Math.max(o[1], q.right)]); }
      const mid = document.documentElement.clientWidth / 2; return [...by.values()].map(([l, r]) => +((l + r) / 2 - mid).toFixed(2)); });
    ok(`${size}: the hero heading is centred, ${lines.length} lines off by ${lines.join(', ')} px`, lines.length >= 1 && lines.every(d => Math.abs(d) <= 1.5));
  } else {
    const bx = await page.evaluate(() => [document.querySelector('header .brand img').getBoundingClientRect().left, document.querySelector('#hero-h').getBoundingClientRect().left]);
    ok(`${size}: the seal and the hero heading share one left edge (${bx.map(v => v.toFixed(2)).join(' and ')})`, Math.abs(bx[0] - bx[1]) <= 0.5);
  }
  /* the trust strip: the words dead centre in their boxes, both ways */
  await page.evaluate(() => document.querySelector('.ts-band').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(1500);
  /* read by INK (~/bb-systems/qa/optical.mjs): the pixels that differ from the navy, never the DOM boxes. The 8px inset
     keeps the band's 18px rounded corners and its gold gap lines out of the reading */
  const ts = [];
  for (let i = 0; i < 4; i++) { const m = await measure(page, '.ts-box', { index: i, inset: 8, cover: '.site-head,.phonebar,.progress' }); ts.push(m.error ? [m.error, ''] : [m.dx, m.dy]); }
  ok(`${size}: the four trust boxes hold their words dead centre by ink (off by ${ts.map(d => d.join('/')).join(', ')} px)`, ts.length === 4 && ts.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1));
  /* the ticker moves, its second copy is hidden from screen readers */
  await page.evaluate(() => document.querySelector('[data-ticker]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  if (!touch) await page.mouse.move(viewport.width - 2, 2);   /* a pointer resting on the band pauses it on purpose (ticker.css) */
  const tk = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-ticker] .tk-row')).transform);
  const k0 = await tk(); await page.waitForTimeout(600); const k1 = await tk();
  const sets = await page.evaluate(() => [...document.querySelectorAll('[data-ticker] .tk-set')].map(s => s.getAttribute('aria-hidden')));
  ok(`${size}: the ticker moves`, k0 !== k1, `${k0} then ${k1}`);
  ok(`${size}: the ticker's second copy is aria-hidden and the first is read`, sets.length === 2 && sets[0] === null && sets[1] === 'true', JSON.stringify(sets));
  /* section headings split into words, every word in place once scrolled to */
  const raw = await (await page.request.get(URL0)).text();
  const plain = await page.evaluate(raw => [...new DOMParser().parseFromString(raw, 'text/html').querySelectorAll('main h2')].map((h, i) => [i, h.children.length, h.textContent.trim().split(/\s+/).length]), raw);
  const split = await page.evaluate(() => [...document.querySelectorAll('main h2')].map(h => [h.classList.contains('split'), h.querySelectorAll(':scope > .sw').length, h.id]));
  const splitBad = plain.filter(([i, kids, n]) => !kids && !(split[i][0] && split[i][1] === n)).map(([i, , n]) => `${split[i][2]}: ${split[i][1]} spans for ${n} words`);
  ok(`${size}: every plain section heading is split into its words (${plain.filter(p => !p[1]).length} headings)`, plain.length === split.length && plain.filter(p => !p[1]).length >= 8 && !splitBad.length, splitBad.join(' | '));
  for (let i = 0; i < split.length; i++) { await page.evaluate(i => document.querySelectorAll('main h2')[i].scrollIntoView({ block: 'center', behavior: 'instant' }), i); await page.waitForTimeout(250); }
  await page.waitForTimeout(2000);
  const words = await page.evaluate(() => [...document.querySelectorAll('main h2.split .sw > span')].filter(s => getComputedStyle(s).transform !== 'none').map(s => s.closest('h2').id + ' "' + s.textContent + '" ' + getComputedStyle(s).transform));
  ok(`${size}: every heading word ends in place after the scroll`, !words.length, words.join(' | '));
  /* wipes end with nothing clipped */
  const wipes = await page.evaluate(() => document.querySelectorAll('[data-reveal=wipe]').length);
  for (let i = 0; i < wipes; i++) { await page.evaluate(i => document.querySelectorAll('[data-reveal=wipe]')[i].scrollIntoView({ block: 'center', behavior: 'instant' }), i); await page.waitForTimeout(300); }
  await page.waitForTimeout(1600);
  const wipeBad = await page.evaluate(() => [...document.querySelectorAll('[data-reveal=wipe] > *')].map(c => [c.className, getComputedStyle(c).clipPath, c.getBoundingClientRect().height]).filter(([, cp, h]) => !(cp === 'none' || /^inset\(0(px)?\)$/.test(cp)) || h < 2));
  ok(`${size}: every wipe (${wipes}) ends with nothing clipped`, wipes >= 1 && !wipeBad.length, JSON.stringify(wipeBad));
  /* the certificate's seal lands */
  await page.evaluate(() => document.querySelector('.sf-paper').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(2200);
  const seal = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('.sf-paper .sf-seal')); return [s.opacity, s.transform]; });
  ok(`${size}: the certificate's seal ends at full opacity with no transform`, seal[0] === '1' && seal[1] === 'none', seal.join(' / '));
  /* stand in plates name the file to send; photo boxes say PHOTO NEEDED */
  /* a plate counts where a visitor can see it; each stage's plate is read with its own stage on */
  const readPlates = () => page.evaluate(() => [...document.querySelectorAll('.shot-wait')].filter(s => s.getBoundingClientRect().width > 1 && s.checkVisibility({ opacityProperty: true, visibilityProperty: true })).map(s => { const m = s.querySelector('.shot-tag small'), r = s.getBoundingClientRect(); return [m?.textContent.trim() || '', !!m && m.checkVisibility({ visibilityProperty: true }) && m.getBoundingClientRect().width > 1, Math.round(r.width) + 'x' + Math.round(r.height)]; }));
  await page.evaluate(() => document.documentElement.classList.add('reveal-all'));
  const plateMap = new Map();
  for (let i = 0; i < 7; i++) { await press(`[data-st-tab="${i}"]`); await page.waitForTimeout(800); for (const pl of await readPlates()) if (!plateMap.has(pl[0]) || !pl[1]) plateMap.set(pl[0], pl); }
  const plates = [...plateMap.values()];
  const plateBad = plates.filter(([n, v]) => !/^[a-z0-9-]+$/.test(n) || !v);
  ok(`${size}: every stand in plate on screen shows the file name to send (${plates.length - plateBad.length} of ${plates.length})`, plates.length >= 1 && !plateBad.length, plateBad.map(p => `${p[0]} ${p[2]} name ${p[1] ? 'shown' : 'hidden'}`).join(' | '));
  const needs = await page.evaluate(() => [...document.querySelectorAll('.shot-need')].map(s => s.textContent.includes('PHOTO NEEDED')));
  ok(`${size}: every photo box says PHOTO NEEDED (${needs.filter(Boolean).length} of ${needs.length})`, needs.length >= 1 && needs.every(Boolean));
  /* the footer name fits its box and ends in place */
  await page.evaluate(() => scrollTo({ left: 0, top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(2200);
  const ft = await page.evaluate(() => { const w = document.querySelector('[data-rise]'), s = w.querySelector('span') || w; return [w.scrollWidth, w.clientWidth, getComputedStyle(s).transform, w.classList.contains('in')]; });
  ok(`${size}: the footer name fits its box (${ft[0]} in ${ft[1]}) and ends in place`, ft[0] <= ft[1] && ft[2] === 'none' && ft[3], JSON.stringify(ft));

  /* 12. the count: every touchpoint pressed, the unpressed named */
  const pressed = new Set(await page.evaluate(() => JSON.parse(sessionStorage.getItem('__pressed') || '[]')));
  const external = [...all].filter(k => k.includes('external '));
  const missed = [...all].filter(k => !pressed.has(k) && !k.includes('external '));
  const opened = [...pressed].filter(k => k.includes('external '));
  console.log(`      ${size}: touchpoints ${all.size}, pressed ${[...all].filter(k => pressed.has(k)).length}, external checked ${external.length}`);
  ok(`${size}: every touchpoint pressed (${all.size - external.length - missed.length} of ${all.size - external.length})`, !missed.length, missed.join(' | '));
  ok(`${size}: no link to another site was opened`, !opened.length, opened.join(' | '));
  ok(`${size}: no console errors during the walk`, !errors.length, errors.join(' | '));
  await ctx.close();
}
ok('the whole walk sent nothing: no request that is not GET and none off the site', !allRequests.length, allRequests.join(' | '));

/* REDUCED MOTION: the same states without movement; the progress line still tracks because it is information */
console.log('\nreduced motion');
for (const [size, viewport, touch] of SIZES) {
  const ctx = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL0, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
  const words = await page.evaluate(() => [document.querySelectorAll('main h2.split').length, [...document.querySelectorAll('main h2.split .sw > span')].filter(s => getComputedStyle(s).transform !== 'none').length]);
  ok(`${size} reduced: the ${words[0]} split headings are in place at once`, words[0] >= 8 && !words[1], `${words[1]} words still moved`);
  await page.waitForFunction(() => document.querySelector('.hero-globe')?.matches('.gl-on,.no-gl'), null, { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '.hero-ring,.hero-plane,.hero-ground{visibility:hidden!important}'; document.head.append(s); });
  const g = page.locator('.hero-globe'); const a = await g.screenshot({ timeout: 20000 }); await page.waitForTimeout(1200); const b = await g.screenshot({ timeout: 20000 });
  const mode = await page.evaluate(() => document.querySelector('.hero-globe').className);
  ok(`${size} reduced: the globe is drawn and holds still (${mode})`, /gl-on|no-gl/.test(mode) && a.equals(b));
  const plane = () => page.evaluate(() => { const a = document.querySelector('[data-hero-art]').getBoundingClientRect(), p = document.querySelector('.hero-plane').getBoundingClientRect(); return [p.left - a.left, p.top - a.top]; });
  const p0 = await plane(); await page.evaluate(() => scrollTo({ left: 0, top: 300, behavior: 'instant' })); await page.waitForTimeout(800); const p1 = await plane();
  ok(`${size} reduced: the plane rests through a scroll`, Math.max(Math.abs(p0[0] - p1[0]), Math.abs(p0[1] - p1[1])) < 0.5, JSON.stringify({ p0, p1 }));
  await page.evaluate(() => document.querySelector('[data-ticker]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  const tk = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-ticker] .tk-row')).transform);
  const k0 = await tk(); await page.waitForTimeout(700); const k1 = await tk();
  ok(`${size} reduced: the ticker stands still`, k0 === k1, `${k0} then ${k1}`);
  await page.evaluate(() => scrollTo({ left: 0, top: 0, behavior: 'instant' })); await page.waitForTimeout(300);
  const pTop = matrixA(await page.evaluate(() => getComputedStyle(document.querySelector('[data-progress]')).transform));
  await page.evaluate(() => scrollTo({ left: 0, top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(400);
  const pEnd = matrixA(await page.evaluate(() => getComputedStyle(document.querySelector('[data-progress]')).transform));
  ok(`${size} reduced: the progress line still tracks (${pTop.toFixed(3)} at the top, ${pEnd.toFixed(3)} at the foot)`, pTop <= 0.01 && pEnd >= 0.99);
  await page.evaluate(() => document.querySelector('[data-st-stage]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  const w0 = await page.textContent('[data-st-where]'); await page.waitForTimeout(5500); const w1 = await page.textContent('[data-st-where]');
  ok(`${size} reduced: the stages do not play by themselves`, w0 === w1, `${w0} then ${w1}`);
  ok(`${size} reduced: no console errors`, !errors.length, errors.join(' | '));
  await ctx.close();
}

/* JAVASCRIPT OFF: every heading and every line of text is there, the form's fields are there */
console.log('\njavascript off');
for (const [size, viewport, touch] of SIZES) {
  const ctx = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL0, { waitUntil: 'load' });
  /* the hero's lines arrive by a CSS entrance that needs no script: read them once it has ended */
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished)));
  const r = await page.evaluate(() => {
    const op = e => { let o = 1; for (let n = e; n; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
    const secs = [...document.querySelectorAll('main section, footer')];
    const bad = [];
    for (const s of secs) for (const e of s.querySelectorAll('h1,h2,h3,p,li,dt,dd,figcaption,blockquote,summary')) {
      if (e.closest('[hidden]') || !e.getClientRects().length || !e.textContent.trim()) continue;
      if (op(e) !== 1 || getComputedStyle(e).visibility !== 'visible') bad.push((s.id || s.className.split(' ')[0]) + ' ' + e.tagName + ' "' + e.textContent.trim().slice(0, 30) + '" opacity ' + op(e).toFixed(2));
    }
    const heads = secs.filter(s => s.querySelector('h1,h2')).length;
    const fields = ['full_name', 'phone', 'country_wanted', 'job_wanted', 'nic', 'passport_no', 'consent'].filter(n => !document.querySelector(`form [name="${n}"]`));
    const step1 = ['full_name', 'phone'].filter(n => !document.querySelector(`[name="${n}"]`).getClientRects().length);
    return { bad, secs: secs.length, heads, fields, step1 };
  });
  ok(`${size} no script: every heading and line of text in ${r.secs} sections shows at full opacity`, r.secs >= 12 && r.heads >= 12 && !r.bad.length, r.bad.join(' | '));
  ok(`${size} no script: the form's seven fields are present and step 1 shows`, !r.fields.length && !r.step1.length, JSON.stringify(r));
  await ctx.close();
}

/* NOTHING CUT OFF at four widths, with the menu, a map card and every form step open; no sideways scroll */
console.log('\nnothing cut off');
for (const w of [375, 390, 768, 1440]) {
  const phone = w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 1000 ? 900 : 844 }, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  await page.goto(URL0, { waitUntil: 'load' });
  const menuBtn = await page.evaluate(() => { const b = document.querySelector('[data-menu-open]'); return !!b && b.checkVisibility() && b.getBoundingClientRect().width > 0; });
  const states = [['first load', async () => {}]];
  if (menuBtn) states.push(['menu open', async () => { await page.click('[data-menu-open]'); }]);
  states.push(['map card open', async () => { await page.locator('[data-wm-country="uae"]').evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await page.click('[data-wm-country="uae"]'); await page.waitForTimeout(1500); }]);
  states.push(['form step 2', async () => page.evaluate(() => document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== '2'; }))]);
  states.push(['form summary', async () => page.evaluate(() => document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== 'done'; }))]);
  for (const [name, act] of states) {
    await page.goto('about:blank'); await page.goto(URL0, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.evaluate(ENDSTATE); await act(); await page.waitForTimeout(150);
    const r = await page.evaluate(clipAudit, { overlays: '#menu' });
    const hits = r.hits || r;
    ok(`${w}px ${name}: nothing cut off`, !hits.length, Array.isArray(hits) ? hits.join(' | ') : JSON.stringify(r));
  }
  await page.goto('about:blank'); await page.goto(URL0, { waitUntil: 'load' });
  const sx = await page.evaluate(async () => { scrollTo({ left: 500, top: 1200, behavior: 'instant' }); await new Promise(r => setTimeout(r, 200)); return [scrollX, document.documentElement.scrollWidth, innerWidth]; });
  ok(`${w}px: no sideways scroll (scrollX ${sx[0]} after a push of 500, page ${sx[1]} wide)`, sx[0] === 0, JSON.stringify(sx));
  await ctx.close();
}

await browser.close();
const fails = R.filter(r => !r.pass);
console.log(`\ncheck-site: ${fails.length ? 'FAIL' : 'PASS'} ${R.length - fails.length} of ${R.length}`);
process.exit(fails.length ? 1 : 0);
