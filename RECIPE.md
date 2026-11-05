# RECIPE: Rathnaweera Foreign Employment Agency home page (staging)
Kind: website
Live: https://businessboosterlk.github.io/rathnaweera-website/ (staging preview, noindex, public repo https://github.com/businessboosterlk/rathnaweera-website, published 5 Nov 2026 on Thulaib's yes, bb_pending 1318)
Live commit: 745efd9
Ignore: dist, node_modules, .astro, package-lock.json
Watch: ~/Downloads/RATHNAWEERA-BRAND/Rathnaweera-Logo.png
Last verified: 2026-11-05, by chat RATHNAWEERA WEBSITE 4 (live gates on the published address)

Checked by `python3 ~/bb-systems/qa/recipe-check.py ~/bb-websites/rathnaweera-website`. A fresh chat rebuilds from
this file alone.

## 1. What it is
The first staging preview of the home page for Rathnaweera Foreign Employment Agency (Ambalantota and a second
office), for Sri Lankans looking for work abroad. It follows storyboard variant 0 of the Clear Assurance design in
the handoff at ~/Downloads/RATHNAWEERA-WEBSITE/handoff-clear-assurance: white led, Libre Caslon Text headings, Inter
body, navy #002B63, red #A80000, gold #C8982A, white and warm white #F7F5EF. It has a hero with the globe and a plane
that flies the orbit on scroll, country tiles that filter the jobs, six sample jobs, an Am I ready checklist, a two
step application form that is a front end preview only and sends nothing, an FAQ and the two offices. Every fact the
agency has not given (licence, phones, fees, salaries, years, counts, timelines) is a gold dashed placeholder, and
every sample job carries a SAMPLE label. The word "licensed" and the Check it link are staging only because the SLBFE
register shows no Rathnaweera (bb_pending 1255). Not yet approved by Thulaib: this is the first preview.

## 2. Where the source lives
- The true copy: `~/bb-websites/rathnaweera-website`, its own git repo, branch main, pushed to the public repo
  https://github.com/businessboosterlk/rathnaweera-website (origin).
- Brief and storyboard: `~/Downloads/RATHNAWEERA-WEBSITE/handoff-clear-assurance` (BB-BUILD-BRIEF.md wins, then
  START-HERE-CLAUDE.md, the storyboard PDF, ASSET-INDEX.md).
- The seal: the REPAIRED one at `~/Downloads/RATHNAWEERA-BRAND/Rathnaweera-Logo.png`. Never the handoff's
  seal-original.png or approved-storyboard/assets/seal.png.
- Every fact still owed: `src/config.js`. All null, shown as placeholders.
- No database, no backend, no form service.

## 3. Rebuild from nothing
```bash
cd ~/bb-websites/rathnaweera-website
npm ci
npm run images
npm run icons
npm run build
npx astro preview --port 4662 --host 127.0.0.1
```

## 4. Gates
```bash
cd ~/bb-websites/rathnaweera-website
npm run build
node scripts/check-site.mjs
python3 ~/bb-systems/stack-standard/check_stack.py ~/bb-websites/rathnaweera-website
node ~/bb-systems/qa/device-views.mjs http://127.0.0.1:4662/rathnaweera-website/ --brand 'header .brand img'
node ~/bb-systems/qa/speed.mjs http://127.0.0.1:4662/rathnaweera-website/
node scripts/rendered-text.mjs dist/rendered.txt
python3 ~/bb-consultancy/house_style.py dist/rendered.txt
python3 ~/bb-systems/qa/recipe-check.py ~/bb-websites/rathnaweera-website
cd src
node ~/bb-systems/qa/hand-svg.mjs . --allow lib/icon.js=1
```
house_style runs on the rendered words, never on the raw HTML: the inline CSS says color and center.
Counts on 5 Nov 2026: check-dist 17 of 17, check-site 113 of 113 (57 touchpoints at phone and at desk), stack PASS
astro, hand-svg PASS, device-views PASS, speed PASS 12 of 12 on the local preview (page to page had nothing to
press), house_style 8 of 8 on the rendered text. Live on 5 Nov 2026 at 745efd9: speed PASS 12 of 12 (slow 4G phone,
first paint and main content 767 ms, page 128 KB, JS 4 KB, layout shift 0.003, reload 223 ms and 0 KB, worst tap 52 ms),
device-views PASS (phone heading middle 201.0 of 201, desk brand and heading at x=100), check-site 113 of 113, robots
meta noindex and robots.txt Disallow all. iOS Simulator (iPhone 17) first screen and one scroll looked right. Then
look at the first screen and one scroll on the iOS Simulator (iPhone 17) and at 1440x900 after every change.

## 5. Deliver or deploy
Only after Thulaib says yes to a public repo and GitHub Pages.
```bash
cd ~/bb-websites/rathnaweera-website
gh repo create businessboosterlk/rathnaweera-website --public --source . --push
gh api -X POST repos/businessboosterlk/rathnaweera-website/pages -f build_type=workflow
gh run watch --repo businessboosterlk/rathnaweera-website
node ~/bb-systems/qa/speed.mjs https://businessboosterlk.github.io/rathnaweera-website/
```
The workflow `.github/workflows/deploy.yml` builds with SITE_URL and BASE_PATH and runs the same gates, so a build
that fails a gate never deploys. On a new repo the push run's deploy job fails with a 404 because Pages is not on
yet: turn Pages on, then `gh run rerun <run id>`. GitHub Pages caches each file for ten minutes (max-age=600).
A commit that changes only RECIPE.md is pushed with [skip ci], so the Live commit stays the build that passed. At launch on the agency's own domain: BASE_PATH '/', open ROBOTS in src/config.js
and robots.txt. The agency holds the hosting, the domain and any form service in its own name. BB provides none.

## 6. Finishing touches
- The seal is the repaired 4 Nov one, refused by hash otherwise | why: the handoff carried the seal from before the 4 Nov repair | held by: scripts/check-dist.mjs#seal masters come from the repaired seal
- No tel: or WhatsApp link until the numbers are confirmed | why: invent no phone number, WhatsApp pending (bb_pending 1239) | held by: scripts/check-dist.mjs#no tel: or wa.me link
- Staging is closed to search engines | why: staging only, nothing indexed before launch | held by: scripts/check-dist.mjs#staging page says noindex
- Every picture is AVIF with a WebP fallback, never a JPG fallback | why: speed budget, biggest image 22 KB | held by: src/pages/index.astro#fallbackFormat="webp"
- The hero clips sideways with overflow-x clip so the orbit and plane never make the page scroll sideways | why: no horizontal scroll ever, and clip keeps sticky working | held by: src/styles/global.css#overflow-x:clip
- Back to top lands at the very top with the staging line and the top line showing | why: the header carried id top so the link stopped 43px down on a phone and 58px on desk | held by: scripts/check-site.mjs#back to top left the page
- The Call and Apply bar on the phone is solid and on its own layer | why: on the iPhone the hero's Apply ghosted through the translucent bar on first paint | held by: scripts/check-site.mjs#nothing shows through it
- The NIC error reads with no comma before or | why: house_style fails a comma before or | held by: scripts/check-site.mjs#NIC number
- In a Safari tab the content scrolls under the clock behind Safari's own fade | why: measured 5 Nov, Safari reports a top inset of 0 in a tab, so no page can paint that strip; the strip works when installed | held by: memory only

## 7. Cast a copy
Never edit this folder for another agency. Copy it, then change `src/config.js` (every fact), the tokens at the top of
`src/styles/global.css`, the seal path and hash in `scripts/prep-images.mjs` and `scripts/check-dist.mjs`, the jobs
and countries in `src/pages/index.astro`, and the repo name in `astro.config.mjs` and the workflow. Keep the
placeholder and SAMPLE rules, the no tel: check and the form that sends nothing until the client chooses a form
service of its own. The prior art for this build was `~/bb-websites/ceylon-carriers`.

## 8. Not on disk
The repaired seal lives outside the repo in ~/Downloads/RATHNAWEERA-BRAND (the masters made from it are in
src/assets/img with its hash in SOURCE.json). The globe and plane art came from the handoff and are not yet approved
by the agency. The iOS Simulator screenshots of 5 Nov live in the chat's tool results, not in the repo. No real
iPhone has seen the page yet.
