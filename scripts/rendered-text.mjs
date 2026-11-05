// The words a visitor reads (page, 404, alt and aria text, meta, script messages) for house_style.py.
// node scripts/rendered-text.mjs <out.txt> [url]   needs the preview running
const { chromium } = await import(`${process.env.HOME}/bb-systems/batch/node_modules/playwright/index.mjs`);
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
const b = await chromium.launch(); const p = await b.newPage();
const out = [];
for (const path of ['', '404.html']) {
  await p.goto((process.argv[3] || 'http://127.0.0.1:4662/rathnaweera-website/') + path);
  out.push(await p.evaluate(() => {
    document.querySelectorAll('script,style').forEach(e => e.remove());
    /* headings arrive word by word in their own spans: read each as the one line a visitor reads */
    document.querySelectorAll('h1,h2').forEach(h => { if (!h.querySelector('.ph,a,button')) h.textContent = h.textContent.replace(/\s+/g, ' ').trim(); });
    document.querySelectorAll('br').forEach(e => e.replaceWith('\n'));
    document.querySelectorAll('p,h1,h2,h3,li,dt,dd,label,option,summary,button,a,span,legend').forEach(e => e.append('\n'));
    const attrs = [...document.querySelectorAll('[alt],[aria-label],[title],[placeholder]')].flatMap(e => ['alt','aria-label','title','placeholder'].map(a => e.getAttribute(a)).filter(Boolean));
    const meta = [...document.querySelectorAll('meta[name=description],meta[property^="og:"]')].map(m => m.content);
    return [document.title, ...meta, document.body.textContent, ...attrs].join('\n');
  }));
}
/* every message a script can show: each section has its own script now */
const js = readdirSync('src/scripts').filter(f => f.endsWith('.js')).flatMap(f => readFileSync('src/scripts/' + f, 'utf8').match(/'[^'\n]{12,}'|`[^`\n]{12,}`/g) || []).filter(s => /[a-z] [a-z]/.test(s) && !/querySelector|data-|=>/.test(s));
out.push(js.join('\n'));
writeFileSync(process.argv[2], out.join('\n').replace(/\n\s*\n+/g, '\n'));
await b.close();
