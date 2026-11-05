#!/usr/bin/env node
/* THE CLICK PATH for the Rathnaweera home page (skill bb-click-path). Every touchpoint on the page is COUNTED from the
   page, PRESSED in a real browser at phone (390, touch) and desk (1440) and its effect READ. After every link, the menu,
   the country filter and the form: Back once undoes exactly one thing, Back twice leaves the page.
   Then NOTHING CUT OFF (clipAudit) at 375, 390, 768 and 1440, with the menu and every form step open.
   The count is done by a recorder in the page, never by hand: a touchpoint the run did not press is named and fails.
     npx astro preview --port 4662 --host 127.0.0.1 &
     node scripts/check-site.mjs [url]       default http://127.0.0.1:4662/rathnaweera-website/
   Links to another site (the SLBFE register) are checked by their attributes and counted apart, never opened. */
import { existsSync } from 'node:fs';
let { chromium } = await import('playwright');
/* the repo's Playwright needs its own browser download; the machine's shared copy is used when that is missing */
if (!existsSync(chromium.executablePath())) ({ chromium } = await import(`${process.env.HOME}/bb-systems/batch/node_modules/playwright/index.mjs`));

const { clipAudit } = await import(`${process.env.HOME}/bb-systems/qa/clip.mjs`);
const URL0 = process.argv[2] || 'http://127.0.0.1:4662/rathnaweera-website/';
const R = [];
const ok = (name, pass, seen = '') => { R.push({ name, pass: !!pass }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (seen && !pass ? '   ' + String(seen).slice(0, 400) : '')); };
const browser = await chromium.launch();

/* runs before the page's own script: names every touchpoint and hears every real press */
const INSTALL = () => {
  const TOUCH = 'a[href],button,summary,select,input:not([type=hidden]):not([tabindex="-1"]),textarea';
  const where = e => e.closest('#menu') ? 'menu' : e.closest('.phonebar') ? 'phone bar' : e.closest('.topline') ? 'top line' : e.closest('.site-head') ? 'header' : e.closest('footer') ? 'footer' : (e.closest('section[id]')?.id || 'page');
  const what = e => {
    if (e.matches('input,select,textarea')) return 'field ' + (e.name + (e.type === 'checkbox' ? ' ' + e.value : ''));
    if (e.tagName === 'SUMMARY') return 'answer "' + e.textContent.trim().slice(0, 30) + '"';
    for (const k of ['applyJob', 'countryTile']) if (e.dataset[k]) return k + ' ' + e.dataset[k];
    for (const k of ['menuOpen', 'menuClose', 'showAll', 'applyReady', 'next', 'back', 'submit', 'restart']) if (k in e.dataset) return k;
    if (e.tagName === 'A') return (e.target === '_blank' ? 'external ' : 'to ') + e.getAttribute('href').slice(0, 40);
    return 'UNNAMED ' + e.outerHTML.slice(0, 60);
  };
  window.__kind = e => where(e) + ': ' + what(e);
  window.__vis = e => { if (e.disabled || e.closest('[hidden],[inert],[aria-hidden="true"]')) return false; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; if (e.checkVisibility && !e.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false; return true; };
  window.__touchpoints = () => [...new Set([...document.querySelectorAll(TOUCH)].filter(window.__vis).map(window.__kind))];
  const hear = ev => { const t = ev.target instanceof Element ? ev.target.closest(TOUCH) : null; if (!t) return; const k = window.__kind(t); const p = JSON.parse(sessionStorage.getItem('__pressed') || '[]'); if (!p.includes(k)) { p.push(k); sessionStorage.setItem('__pressed', JSON.stringify(p)); } };
  document.addEventListener('click', hear, true); document.addEventListener('change', hear, true); document.addEventListener('input', hear, true);
};

const SIZES = [['phone', { width: 390, height: 844 }, true], ['desk', { width: 1440, height: 900 }, false]];
for (const [size, viewport, touch] of SIZES) {
  console.log(`\n${size} ${viewport.width}x${viewport.height}`);
  const ctx = await browser.newContext({ viewport, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 3 : 1 });
  await ctx.addInitScript(INSTALL);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  const posts = []; page.on('request', r => { if (r.method() !== 'GET' || !r.url().startsWith(new URL(URL0).origin)) posts.push(r.method() + ' ' + r.url()); });
  const fresh = async () => { await page.goto('about:blank'); await page.goto(URL0, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); };
  const press = async sel => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); touch ? await l.tap() : await l.click(); await settle(); };
  const settle = async () => { let y = -1; for (let i = 0; i < 30; i++) { await page.waitForTimeout(60); const n = await page.evaluate(() => scrollY); if (n === y) break; y = n; } };
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

  /* ALL: every touchpoint visible in any state of the page (menu open, each form step) */
  const all = new Set(await page.evaluate(() => window.__touchpoints()));
  if (touch) { await press('[data-menu-open]'); (await page.evaluate(() => window.__touchpoints())).forEach(k => all.add(k)); await fresh(); }
  await page.evaluate(() => { document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== '2'; }); }); (await page.evaluate(() => window.__touchpoints())).forEach(k => all.add(k));
  await page.evaluate(() => { document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== 'done'; }); }); (await page.evaluate(() => window.__touchpoints())).forEach(k => all.add(k));
  await fresh();
  await page.evaluate(() => sessionStorage.removeItem('__pressed'));

  /* 1. every link inside the page, from a fresh load: lands, Back once returns, Back twice leaves */
  const anchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter(a => window.__vis(a) && !a.closest('#menu') && !a.matches('[data-apply-job],[data-apply-ready]')).map((a, i) => { a.dataset.cp = 'a' + i; return ['a' + i, a.getAttribute('href'), window.__kind(a)]; }));
  for (const [id, href, kind] of anchors) {
    await fresh();
    await page.evaluate(id => { const a = [...document.querySelectorAll('a[href^="#"]')].filter(a => window.__vis(a) && !a.closest('#menu') && !a.matches('[data-apply-job],[data-apply-ready]'))[+id.slice(1)]; a.dataset.cp = id; }, id);
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
  const tiles = await page.evaluate(() => [...document.querySelectorAll('[data-country-tile]')].map(b => b.dataset.countryTile));
  for (const t of tiles) {
    await fresh(); await press(`[data-country-tile="${t}"]`);
    const s = await st(), pressed = await page.getAttribute(`[data-country-tile="${t}"]`, 'aria-pressed');
    await back(); const b1 = await st(); await back();
    ok(`${size}: country ${t} shows only its jobs, Back once shows all, Back twice leaves`, s.filter && s.jobs.length >= 1 && s.jobs.every(c => c === t) && pressed === 'true' && !b1.filter && b1.jobs.length === 6 && left(), JSON.stringify({ s, b1, left: left() }));
  }
  await fresh(); await press(`[data-country-tile="${tiles[0]}"]`); await press(`[data-country-tile="${tiles[1]}"]`); await back();
  ok(`${size}: two countries in a row, Back returns to the first`, (await st()).jobs.every(c => c === tiles[0]));
  for (const where of ['.filter-line [data-show-all]', '.section-head [data-show-all]']) {
    await fresh(); await press(`[data-country-tile="${tiles[0]}"]`); await press(where);
    const s = await st(); await back(); const b1 = await st();
    ok(`${size}: ${where.startsWith('.filter') ? 'Show all' : 'See all jobs'} clears the filter, Back brings it back`, !s.filter && s.jobs.length === 6 && b1.jobs.every(c => c === tiles[0]), JSON.stringify({ s, b1 }));
  }

  /* 4. Am I ready to apply? */
  await fresh();
  await press('.checklist input[value="Passport"]');
  const one = await page.evaluate(() => [document.querySelector('[data-ready-title]').textContent, document.querySelector('[data-ready-list]').textContent]);
  ok(`${size}: ticking Passport leaves four things, Passport off the list`, one[0] === 'You still need four things' && !one[1].includes('Passport'), one.join(' / '));
  for (const v of await page.evaluate(() => [...document.querySelectorAll('.checklist input')].slice(1).map(i => i.value))) await press(`.checklist input[value="${v}"]`);
  ok(`${size}: ticking all five says every document`, (await page.textContent('[data-ready-title]')) === 'You have every document on this list');
  await press('[data-apply-ready]');
  ok(`${size}: Apply with these answers goes to the form`, (await st()).hash === '#apply');

  /* 5. Apply for this job fills the form */
  for (const j of await page.evaluate(() => [...document.querySelectorAll('[data-apply-job]')].map(a => [a.dataset.applyJob, a.dataset.applyCountry]))) {
    await fresh(); await press(`[data-apply-job="${j[0]}"]`);
    const v = await page.evaluate(() => [location.hash, document.querySelector('[name=job_wanted]').value, document.querySelector('[name=country_wanted]').value, document.querySelector('[data-picked]').hidden ? '' : document.querySelector('[data-picked]').textContent]);
    ok(`${size}: Apply for this job (${j[0]}) lands on the form with job and country picked`, v[0] === '#apply' && v[1] === j[0] && v[2] === j[1] && v[3].startsWith('You picked:'), v.join(' / '));
  }

  /* 6. the form preview: checks, two steps, a summary, nothing sent */
  await fresh(); posts.length = 0;
  await press('.checklist input[value="Passport"]');
  await page.locator('#apply').scrollIntoViewIfNeeded();
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
  await page.selectOption('[name=country_wanted]', { index: 1 }); await page.selectOption('[name=job_wanted]', { index: 1 });
  await page.fill('[name=nic]', '123'); await press('[data-submit]');
  ok(`${size}: a wrong NIC number is refused`, (await err('2')).includes('NIC'));
  await page.fill('[name=nic]', ''); await page.fill('[name=passport_no]', 'N1234567'); await press('[data-submit]');
  ok(`${size}: no consent tick, no summary`, (await err('2')).includes('Tick') && (await st()).step === '2');
  await press('[name=consent]'); await press('[data-submit]');
  const sum = await page.evaluate(() => [...document.querySelectorAll('[data-summary] dd')].map(d => d.textContent));
  ok(`${size}: Send shows the summary with seven answers and the mobile in 07 form`, (await st()).step === 'done' && sum.length === 7 && sum[1] === '0771234567', sum.join(' | '));
  ok(`${size}: the form sent nothing anywhere`, !posts.length && new URL(page.url()).pathname === new URL(URL0).pathname, posts.join(' | '));
  await press('[data-restart]');
  ok(`${size}: Start again empties the form and returns to step 1`, (await st()).step === '1' && (await page.inputValue('[name=full_name]')) === '');

  /* 7. every answer opens and closes */
  await fresh();
  const faqs = await page.evaluate(() => [...document.querySelectorAll('#faq summary')].filter(window.__vis).length);
  let toggled = 0;
  for (let i = 0; i < faqs; i++) {
    const sel = `#faq details:nth-of-type(${i + 1}) > summary`;
    const before = await page.evaluate(i => [...document.querySelectorAll('#faq details')].filter(d => window.__vis(d.querySelector('summary')))[i].open, i);
    await page.evaluate(i => { [...document.querySelectorAll('#faq summary')].filter(window.__vis)[i].dataset.cp = 'faq' + i; }, i);
    const l = page.locator(`[data-cp="faq${i}"]`); await l.scrollIntoViewIfNeeded(); touch ? await l.tap() : await l.click(); await page.waitForTimeout(80);
    const after = await page.evaluate(i => [...document.querySelectorAll('#faq details')].filter(d => window.__vis(d.querySelector('summary')))[i].open, i);
    if (after !== before) toggled++; void sel;
  }
  ok(`${size}: every answer opens and closes (${toggled} of ${faqs}, ${touch ? 'six on a phone' : 'eight on a desk'})`, toggled === faqs && faqs === (touch ? 6 : 8));

  /* 8. links to another site: checked, never opened */
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[target=_blank]')].filter(window.__vis).map(a => [a.href, a.rel]));
  ok(`${size}: ${ext.length} Check it links open the SLBFE register in a new tab, noopener`, ext.length >= 3 && ext.every(([h, r]) => h.startsWith('https://applications.slbfe.lk/') && r.includes('noopener')), JSON.stringify(ext));

  /* 9. the count: every touchpoint pressed, the unpressed named */
  const pressed = new Set(await page.evaluate(() => JSON.parse(sessionStorage.getItem('__pressed') || '[]')));
  const external = [...all].filter(k => k.includes('external '));
  const missed = [...all].filter(k => !pressed.has(k) && !k.includes('external '));
  console.log(`      ${size}: touchpoints ${all.size}, pressed ${[...all].filter(k => pressed.has(k)).length}, external checked ${external.length}`);
  ok(`${size}: every touchpoint pressed (${all.size - external.length - missed.length} of ${all.size - external.length})`, !missed.length, missed.join(' | '));
  ok(`${size}: no console errors during the walk`, !errors.length, errors.join(' | '));
  await ctx.close();
}

/* NOTHING CUT OFF at four widths, with the menu and every form step open */
console.log('\nnothing cut off');
for (const w of [375, 390, 768, 1440]) {
  const phone = w < 760;
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 1000 ? 900 : 844 }, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  const states = [['first load', async () => {}]];
  if (phone) states.push(['menu open', async () => { await page.click('[data-menu-open]'); }]);
  states.push(['form step 2', async () => page.evaluate(() => document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== '2'; }))]);
  states.push(['form summary', async () => page.evaluate(() => document.querySelectorAll('[data-step]').forEach(s => { s.hidden = s.dataset.step !== 'done'; }))]);
  for (const [name, act] of states) {
    await page.goto(URL0, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await act(); await page.waitForTimeout(150);
    const r = await page.evaluate(clipAudit, { overlays: '#menu' });
    const hits = r.hits || r;
    ok(`${w}px ${name}: nothing cut off`, !hits.length, Array.isArray(hits) ? hits.join(' | ') : JSON.stringify(r));
  }
  await ctx.close();
}

await browser.close();
const fails = R.filter(r => !r.pass);
console.log(`\ncheck-site: ${fails.length ? 'FAIL' : 'PASS'} ${R.length - fails.length} of ${R.length}`);
process.exit(fails.length ? 1 : 0);
