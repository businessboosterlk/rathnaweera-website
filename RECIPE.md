# RECIPE: Rathnaweera Foreign Employment Agency home page (staging)
Kind: website
Live: https://businessboosterlk.github.io/rathnaweera-website/ (staging preview, noindex, public repo https://github.com/businessboosterlk/rathnaweera-website, published 5 Nov 2026 on Thulaib's yes, bb_pending 1318)
Live commit: 7df87d2
Ignore: dist, node_modules, .astro, package-lock.json
Watch: ~/Downloads/RATHNAWEERA-BRAND/Rathnaweera-Logo.png
Last verified: 2026-11-06, by chats RATHNAWEERA WEBSITE 7 and 8 (live gates on the published address)

Checked by `python3 ~/bb-systems/qa/recipe-check.py ~/bb-websites/rathnaweera-website`. A fresh chat rebuilds from
this file alone.

## 1. What it is
The staging preview of the home page for Rathnaweera Foreign Employment Agency (Ambalantota and a second office),
for Sri Lankans looking for work abroad. This is the 5 Nov 2026 redesign, made after Thulaib rejected the first
preview as plain and without motion. Look: white led, Libre Caslon Text headings, Inter body, navy #002B63, red
#A80000, gold #C8982A, white and warm white #F7F5EF. One component per section in `src/components`, each with its own
stylesheet in `src/styles` and its own small script in `src/scripts`. No animation library: CSS, the Web Animations
API and hand written modules only, 17 KB of script in all.
The plane is a flat 2D picture (`src/assets/img/hero-plane.webp`), not a 3D model: `src/scripts/hero.js` slides it
round a ring, in front of the globe on the near half, smaller and behind it on the far half. At each end of the ring
it narrows to no less than half its width and fades through the flip and it can never rest inside a turn (6 Nov 2026).
The page, top to bottom: a hero with a globe that turns by itself and a plane that flies its orbit only when the
visitor scrolls; a navy strip of four facts whose words are measured to the centre of their boxes; a moving band of
the six countries; six sample jobs with country chips; a world map where pressing a country lifts its picture card
out of its own spot and a scroll, Escape, the sea or another country puts it back; How it works as seven stages that
play by themselves and can be pressed; an Am I ready checklist that carries into a two step application form that is
a preview and sends nothing; Stay safe from fake agents with a certificate card; three guides; Who you will meet,
built around photo frames; an FAQ; the two offices; a footer with the agency name set large.
ON A PHONE the hero, every section heading and its lead are CENTRED and buttons run the full width (BB's standing
rule, Thulaib 29 Sep 2026). ON A DESK the brand sits hard left, Apply hard right and the hero words start on the
brand's left edge (Thulaib's review, 5 Nov 2026). `device-views.mjs` reads both.
Every fact the agency has not given (licence, phones, fees, salaries, years, counts, timelines) is a gold dashed
placeholder and every sample carries a SAMPLE label. The scene pictures are in since 5 Nov 2026 (24 of 25: jobs,
countries, stages, Apply, Safety and guides; the plane is still the handoff one). A picture that goes missing shows
a stand in plate with the file name to send, and every real photo owed shows a PHOTO NEEDED frame. The word "licensed" and the Check it link
are staging only because the SLBFE register shows no Rathnaweera (bb_pending 1255). Thulaib looked at build 8eb1c17 on 5 Nov 2026 and said it is good to show Janaka (bb_pending 1356).

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
npm run images -- --scenes-only
npm run icons
node scripts/build-globe.mjs
node scripts/build-map.mjs
npm run build
npx astro preview --port 4662 --host 127.0.0.1
```
`--scenes-only` remakes the pictures and leaves the seal alone: the logo in the brand folder was remade on 5 Nov
(hash starts fa47698675f5) and the plain `npm run images` refuses it until Thulaib decides (bb_pending 1330).
Pictures are picked up BY FILE NAME from `~/Downloads/RATHNAWEERA-WEBSITE/new-images/` (the 25 made from
`~/Downloads/RATHNAWEERA-WEBSITE/Rathnaweera-Image-Prompts-for-ChatGPT.md`, bb_pending 1331, done 5 Nov 2026) and
`~/Downloads/RATHNAWEERA-WEBSITE/real-photos/` (bb_pending 1332). A missing name shows a stand in, never a broken
picture. Thulaib's originals are in `~/Downloads/RFEA IMAGES WEB/` under ChatGPT's own names; chat 7 copied 24 of
them into `new-images/` under the site names on 5 Nov 2026. Nine came as a square scene padded out to 3:2 with a
blurred copy of itself, so `prep-images.mjs` cuts each of those to its clean middle (the CUT table) before it makes
the master. The plane cut-out (`01_aircraft_transparent.png`) has a blocky white fringe and was NOT used: the page
keeps the handoff plane until a clean one is made (bb_pending 1400). Six pictures carry a focus point
(`FOCUS` in `src/lib/img.js`) so a wide or upright slot keeps the subject in frame. To look at every picture in its
real slot after a change, photograph the slots at 390 and 1440 and read the sheets before anything is pushed. `build-globe.mjs` makes `public/assets/earth.webp` (99 KB) and `build-map.mjs` makes
`src/data/world-map.json` (42 KB) from Natural Earth data; both outputs are committed, so the deploy needs neither.
Astro allows one dev server per repo: a second needs `--ignore-lock`.

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
node ~/bb-systems/qa/hand-svg.mjs . --allow lib/icon.js=1,lib/worldmap.js=1
```
house_style runs on the rendered words, never on the raw HTML: the inline CSS says color and center.
The hand-svg allow names two files because both are svg WRITERS, not hand drawn art: `lib/icon.js` writes the
Lucide sprite and `lib/worldmap.js` writes the world map from Natural Earth data made by `scripts/build-map.mjs`.
No other file in `src` may carry an svg, and check-dist holds the same rule inside the build.
Two checks changed their SUBJECT in the redesign and neither was loosened. On the phone "brand x equals hero heading
x" became "hero heading centred within 1.5px", because the phone is now centred (BB's standing rule); the desk still
reads "brand x = heading x". The fact strip check now reads the INK of the words, not their boxes (his review point
10). On the map the phone presses every country from its chip (6 of 6) and every pin; shapes too small for a
fingertip are counted, not failed.
A third check changed its SUBJECT on 5 Nov 2026 when the pictures went in, and it was not loosened. "Every stand in
plate on screen shows the file name to send" needed at least one plate; no plate is left, so it now reads "any stand
in plate left on screen shows the file name to send". Two new checks prove what took the plates' place: check-site
"every picture on the page loads" (25 of 25, phone and desk) and check-dist "every scene picture is on the page"
(fails on any plate), with a second new check-dist line for the six focus points.
Counts on 6 Nov 2026 at 7df87d2 (plane turn), local preview: check-dist 26 of 26 (two new checks: "the plane is never
drawn thinner than half its width and fades through both turns" and "wherever the page stops the plane is whole",
weakest 1.00 and narrowest 0.59), check-site 244 of 244 (check-site was not changed), stack PASS astro, hand-svg PASS,
device-views PASS, speed PASS 12 of 12, house_style OK on the rendered text. At every stopping point on phone 390 and
desk 1440 the plane reads opacity 1.00 in front or 0.90 behind and at least 0.59 of its width; the turn is gone and
back within 170 ms. On the iPhone 17 Pro Simulator the first screen is clear of the status bar and the plane is whole
when stopped at the right hand turn.
Live on 6 Nov 2026 at 7df87d2 (the published index.html and 8 scripts carry the same hash as this build): check-site PASS
244 of 244, speed PASS 12 of 12 (slow 4G phone, first paint and main content 737 ms, page 255 KB, JS 14 KB, layout
shift 0.000, biggest image 100 KB, reload 291 ms and 0 KB, worst tap 80 ms), device-views PASS (phone heading middle
201.0 of 201, desk brand and heading at x=49), robots meta noindex, no tel or wa.me link. The first live check-site
run on this build read 243 of 244 (phone Help to #ready, heading top -4279) while the Mac's network slept mid run
(speed could not run at all, net::ERR_NETWORK_IO_SUSPENDED); rerun alone with the Mac kept awake by `caffeinate -is`
the unchanged check passed 244 of 244. By design the plane is hidden behind the globe for about 21 per cent of the
flight (55 to 77 per cent of the way round); Thulaib kept the full orbit on 6 Nov 2026 (bb_pending 1453).
Earlier counts, on 5 Nov 2026 at 5095826 (pictures in), local preview: check-dist 24 of 24, check-site 244 of 244 (phone 101
touchpoints found, 97 pressed, 4 external checked; desk 102 found, 97 pressed, 5 external checked), stack PASS astro,
hand-svg PASS, device-views PASS (phone heading middle 201.0 of 201, desk brand and heading at x=49), speed PASS 12
of 12 (reload main content 412 ms, worst tap 96 ms), house_style OK on the rendered text. The first check-site run
on that build read 242 of 244: two links (phone Help to #ready, desk header to #help) were read while the glide had
paused for one 60 ms beat. Pressed directly 8 times each they landed 16 of 16 (press to first movement 40 to 63 ms,
longest hold 17 ms), and the unchanged check then passed 244 of 244 locally. The check was NOT changed. If it
happens again, rerun alone before touching anything.
Live on 5 Nov 2026 at 5095826: speed PASS 12 of 12 (slow 4G phone, first paint and main content 643 ms, page 255 KB,
JS 14 KB, layout shift 0.000, biggest image 99 KB, reload 319 ms and 0 KB, worst tap 88 ms), device-views PASS (phone
heading middle 201.0 of 201, desk brand and heading at x=49), check-site PASS 244 of 244 (same touchpoints as local, every picture loads 25 of 25), 25 pictures, 0 stand in plates
and 6 focus points read off the published page, robots meta noindex.
Earlier counts, on 5 Nov 2026 at 8eb1c17 (before the pictures), local preview: check-dist 22 of 22, check-site 242 of 242 (phone 101 touchpoints
found, 97 pressed, 4 external checked; desk 102 found, 97 pressed, 5 external checked; Back once and twice; clipAudit
at 375, 390, 768 and 1440), stack PASS astro, hand-svg PASS, device-views PASS, speed PASS 12 of 12 (main content
427 ms, worst tap 112 ms, page to page had nothing to press), house_style OK on the rendered text, optical within
0.5px by ink on the four strip boxes and stage swap 0 wide frames of 842 (both read by chat 6).
Live on 5 Nov 2026 at 8eb1c17: speed PASS 12 of 12 (slow 4G phone, first paint and main content 563 ms, page 252 KB,
JS 14 KB, layout shift 0.000, biggest image 100 KB, reload 312 ms and 0 KB, worst tap 120 ms), device-views PASS
(phone heading middle 201.0 of 201, desk brand and heading at x=49), check-site PASS 242 of 242 (same touchpoints as local), robots meta noindex and
robots.txt Disallow all. iOS Simulator (iPhone 17) first screen and one scroll looked right, and so did 1440x900.
A check-site run takes about 8 minutes: run it alone and never rebuild `dist` while it runs. Look at the first
screen and one scroll on the iOS Simulator (iPhone 17) and at 1440x900 after every change.

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
- Every picture is AVIF with a WebP fallback, never a JPG fallback | why: speed budget, biggest image 99 KB (the globe) | held by: src/components/Shot.astro#fallbackFormat
- The hero clips sideways with overflow-x clip so the orbit and plane never make the page scroll sideways | why: no horizontal scroll ever, and clip keeps sticky working | held by: src/styles/global.css#overflow-x:clip
- Back to top lands at the very top with the staging line and the top line showing | why: the header carried id top so the link stopped 43px down on a phone and 58px on desk | held by: scripts/check-site.mjs#back to top left the page
- The Call and Apply bar on the phone is solid and on its own layer | why: on the iPhone the hero's Apply ghosted through the translucent bar on first paint | held by: scripts/check-site.mjs#nothing shows through it
- The NIC error reads with no comma before or | why: house_style fails a comma before or | held by: scripts/check-site.mjs#NIC number
- The globe turns by itself all the time and stands still under reduced motion | why: Thulaib's review point 1, 5 Nov | held by: src/scripts/globe.js#prefers-reduced-motion
- The plane flies its orbit ONLY when the visitor scrolls or swipes, never on a timer | why: Thulaib's review point 1 | held by: src/scripts/hero.js#moves ONLY when the visitor scrolls
- The plane is a flat 2D picture so at each end of the ring it narrows to no less than half its width and fades through the flip (opacity from `--po`), never a squashed sliver | why: Thulaib asked on 6 Nov 2026 that the plane look good even at the end; before this it squashed to 16 per cent of its width at both turns | held by: scripts/check-dist.mjs#the plane is never drawn thinner than half its width
- The plane can never REST inside a turn: `angle()` in hero.js holds it 14 degrees short of each end of the ring then sends it to the far side and the glide carries it round in about a fifth of a second | why: with the fade alone a visitor who stopped scrolling exactly at the turn was left looking at a ghost plane (seen on the iOS Simulator on 6 Nov 2026 at 6f5fcad) | held by: scripts/check-dist.mjs#wherever the page stops the plane is whole
- The plane keeps its full orbit and is hidden behind the globe for about a fifth of the flight (55 to 77 per cent of the way round) | why: Thulaib, 6 Nov 2026, "Keep full orbit" (bb_pending 1453); the other choice was the plane in front of the globe the whole time | held by: scripts/check-dist.mjs#angle(1) === ORBIT.a0 - 360
- Every section heading arrives word by word from behind a mask, the same move as the hero's first line | why: his review said plain and no motion; one reveal language for the whole page | held by: src/scripts/reveal.js#classList.add('split')
- The hero word mask is padded past the letters on every side and pulled back by the same amount | why: clipAudit found the mask cutting 4 to 8px off the top of Caslon's box at four widths | held by: src/styles/hero.css#pulled back so the heading keeps its place
- A gold line under the status strip fills as the page is read | why: motion that is also information; it still tracks under reduced motion | held by: src/scripts/motion.js#data-progress
- The band of six countries moves by itself, pauses under a pointer and stands still under reduced motion | why: his review point 2 | held by: src/styles/ticker.css#@keyframes
- Large pictures open with a curtain wipe (the only clip-path animation on the page) | why: everything else animates transform and opacity only, for speed | held by: src/styles/global.css#data-reveal=wipe
- Real pictures drift a little inside their frames as the page moves, only where the browser ties motion to scroll | why: depth without a library or a scroll listener | held by: src/styles/global.css#shot-drift
- A picture that is missing shows a navy plate with its icon and the file name to send; a real photo owed shows a PHOTO NEEDED frame | why: the real photos are still owed (bb_pending 1332) and a broken picture must never show | held by: src/styles/global.css#shot-wait
- Every scene picture is on the page and none is a stand in | why: Thulaib made the pictures on 5 Nov 2026 and a master that goes missing must fail the build, not show a plate to a visitor | held by: scripts/check-dist.mjs#every scene picture is on the page
- Nine pictures are cut to their clean middle before the master is made | why: ChatGPT padded a square scene out to 3:2 with a blurred copy of itself down both sides and the band showed in the slot | held by: scripts/prep-images.mjs#const CUT
- Six pictures carry a focus point so the crop keeps the subject (tower tops on the map cards and the ticks and the camera in the upright guide cards) | why: a centred crop cut the Bahrain and Dubai tower tips and hid Kuwait's towers on the phone | held by: scripts/check-dist.mjs#six pictures keep their focus point
- Below the desk layout a piece that would slide in from the side rises instead | why: the gutter is narrower than the slide, so the waiting piece stood past the screen edge, widened the page to 414 on a phone and 774 on a tablet and broke four taps | held by: src/styles/global.css#would stand past the screen edge
- On a phone the hero, every section heading and its lead are centred; on a desk they start on the brand's left edge | why: BB's standing rule (Thulaib 29 Sep 2026) and his review point 9 | held by: src/styles/global.css#main section h2{text-align:center}
- On a phone the boxed licence chip above the hero heading is hidden | why: a boxed chip above a centred heading is an AI tell and the navy strip right above already says it | held by: src/styles/global.css#main .hero .hero-chip{display:none}
- The desk frame is 1680 wide with a gutter that grows with the screen, so the brand sits hard left and Apply hard right | why: his review point 9, the old frame was narrow and centred | held by: src/styles/global.css#--max:1680px
- The words in the navy fact strip sit in the centre of their boxes by their INK, with a fallback where text-box trim is missing, a 2px lift for the Check it link box and a 0.75px drop for the worded Caslon fact | why: his review point 10; measured with optical.mjs, all four within the limit | held by: src/styles/trust.css#@supports not (text-box
- The fourth strip box lifts its words 1px because the p in its label hangs a solid stem under the line | why: optical.mjs read it 1.33px low on the phone and 1.49px on the desk; now 0.33 and 0.5 | held by: src/styles/trust.css#.ts-box:has(.ts-hang)
- A stage panel's slide is never longer than the room beside it | why: each stage swap slid a panel 44px past a 25px gutter and widened a 768 page to 787 for a few frames | held by: src/scripts/stages.js#never longer than the room beside the panel
- On a stage swap the picture settles inside its frame; the frame itself never scales | why: the frame grew 6 per cent on every swap and stood 18px past a 768 screen (0 wide frames of 842 after the fix, at 375, 390, 768 and 1440) | held by: src/scripts/stages.js#the frame itself never grows
- The moving band tells the clip check that it cuts its row on purpose | why: clipAudit reads a marquee as cut text at every width | held by: src/components/Ticker.astro#data-may-cut
- A stand in plate shows its file name down to 199px wide | why: the Apply picture's plate is 227px wide on a desk and its name was hidden | held by: src/styles/global.css#max-width:199px){.shot-tag
- No prefetch script: the build carries no fetch at all | why: a preview that sends nothing must not carry a script that reaches out, and a one page site has nothing to prefetch | held by: scripts/check-dist.mjs#XMLHttpRequest or sendBeacon in any built script
- The numeral in the active stage ring is nudged a tenth of a pixel | why: optical.mjs read ring 3 at 0.65px off on the phone | held by: src/styles/stages.css#translateY(.1px)
- How it works plays by itself, stops for good after the first press and says Step n of 7 | why: his review point 4; a sequence that keeps moving after a press fights the hand | held by: src/scripts/stages.js#data-st-play
- The map is drawn by one writer from Natural Earth data, never by hand; a country's card closes on scroll, Escape, the sea or another country | why: his review point 3; hand-svg allows lib/worldmap.js for the same reason it allows lib/icon.js | held by: src/scripts/worldmap.js#Escape
- Opening the phone menu keeps the country filter in the history entry | why: builder B's note, the menu used to wipe the filter on Back | held by: src/scripts/header.js#pushState({ ...(history.state || {})
- In Who you will meet the heading is the first thing in the section on a phone and sits at the top of the words column on a desk | why: the About link landed on an empty photo frame with the heading 638px down the phone screen | held by: src/components/Team.astro#so the About link lands on
- The certificate card catches a slow sheen and its seal lands like a stamp | why: his review point 6, the most credible block on the page | held by: src/styles/safety.css#sf-sheen
- The agency's name in the footer rises once from behind its own edge and is sized to fit its box at every width | why: at 390 the name ran past the frame before the fit | held by: src/scripts/motion.js#data-rise
- house_style reads every built page's rendered words | why: the first script read one page | held by: scripts/rendered-text.mjs#readdirSync
- In a Safari tab the content scrolls under the clock behind Safari's own fade | why: measured 5 Nov, Safari reports a top inset of 0 in a tab, so no page can paint that strip; the strip works when installed | held by: memory only

## 7. Cast a copy
Never edit this folder for another agency. Copy it, then change `src/config.js` (every fact), the tokens at the top of
`src/styles/global.css`, the seal path and hash in `scripts/prep-images.mjs` and `scripts/check-dist.mjs`, the jobs
in `src/components/Jobs.astro`, the countries in `scripts/build-map.mjs` (then run it), the stages in
`src/components/Stages.astro`, and the repo name in `astro.config.mjs` and the workflow. Keep the
placeholder and SAMPLE rules, the no tel: check and the form that sends nothing until the client chooses a form
service of its own. The prior art for this build was `~/bb-websites/ceylon-carriers`.

## 8. Not on disk
The repaired seal lives outside the repo in ~/Downloads/RATHNAWEERA-BRAND (the masters made from it are in
src/assets/img with its hash in SOURCE.json). Thulaib's 25 picture originals are in ~/Downloads/RFEA IMAGES WEB and
the 24 in use are in ~/Downloads/RATHNAWEERA-WEBSITE/new-images under the site names; the masters made from them are
committed, so the deploy needs neither folder. The real photos are not taken yet (drop folder
~/Downloads/RATHNAWEERA-WEBSITE/real-photos) and a clean plane cut-out is still owed. The mould for this redesign and the hand-over between chats 5 and 6
live in the side session notes folder of chat 5, not in the repo. Before and after pictures are in
~/Downloads/RATHNAWEERA-WEBSITE/staging-preview and ~/Downloads/RATHNAWEERA-WEBSITE/redesign-preview. No real iPhone
has seen the page yet. When the agency's real facts replace the placeholders, measure the fact strip again with
`~/bb-systems/qa/optical.mjs`: its nudges were set for the words on screen today.
